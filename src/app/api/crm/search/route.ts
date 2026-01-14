import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeCustomer, normalizeRepairOrder, normalizeVehicle, ZohoListResponse } from '../_shared';

const CONTACTS_MODULE = 'Contacts';
const VEHICLES_MODULE = 'Vehicles';
const REPAIR_ORDERS_MODULE = 'Repair_Orders';

const isLikelyPhone = (q: string) => {
  const digits = q.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const isLikelyVin = (q: string) => {
  const s = q.trim().toUpperCase();
  if (!/^[A-Z0-9]+$/.test(s)) return false;
  return s.length >= 11 && s.length <= 17;
};

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

const safeLimit = (n: number, fallback: number) => {
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.max(Math.floor(n), 1), 50);
};

const tokenize = (q: string) =>
  q
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);

const buildAndContainsCriteria = (fields: string[], q: string) => {
  const tokens = tokenize(q);
  if (!tokens.length) return '';

  const perToken = tokens.map((t) => {
    const orClause = fields.map((f) => `(${f}:contains:${t})`).join(' or ');
    return `(${orClause})`;
  });

  return perToken.length === 1 ? perToken[0] : `(${perToken.join(' and ')})`;
};

type CustomerResult = { id: string; name: string; phone?: string; email?: string };

type VehicleResult = {
  id: string;
  display: string;
  vin?: string;
  plate?: string;
  customerName?: string;
  customerPhone?: string;
};

type RepairOrderResult = {
  id: string;
  status: string;
  serviceType?: string;
  vehicleDisplay?: string;
  customerName?: string;
  customerPhone?: string;
  updatedAt?: string;
};

export const GET = async (req: NextRequest) => {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  const limit = safeLimit(Number(req.nextUrl.searchParams.get('limit') || '5'), 5);
  const debug = req.nextUrl.searchParams.get('debug') === '1';

  if (!q) {
    return NextResponse.json({ customers: [], vehicles: [], repairOrders: [] });
  }

  const qDigits = q.replace(/\D/g, '');
  const qVin = q.trim().toUpperCase();

  try {
    const callErrors: Record<string, any> = {};
    const safeGetList = async (label: string, endpoint: string) => {
      try {
        const resp = await makeZohoServerRequest<ZohoListResponse<any>>({ method: 'GET', endpoint });
        return resp.data || [];
      } catch (e: any) {
        callErrors[label] = e?.response?.data || e?.message || String(e);
        return [];
      }
    };

    const customerFields = ['id', 'First_Name', 'Last_Name', 'Phone', 'Email'].join(',');
    const vehicleFields = ['id', 'Name', 'Make', 'Model', 'Vin', 'License_Plate', 'Owner1'].join(',');
    const roFields = [
      'id',
      'Name',
      'Status',
      'Note',
      'Job_Description',
      'Vehicle',
      'Customer',
      'Created_Time',
      'Modified_Time',
    ].join(',');

    let zohoCustomers: any[] = [];
    let zohoVehicles: any[] = [];
    let zohoRepairOrders: any[] = [];

    if (isLikelyPhone(q)) {
      const phone = qDigits;

      const customerCriteria = `(Phone:equals:${phone})`;

      const customersResp = await makeZohoServerRequest<ZohoListResponse<any>>({
        method: 'GET',
        endpoint: `/${CONTACTS_MODULE}/search?criteria=${encodeURIComponent(
          customerCriteria
        )}&fields=${encodeURIComponent(customerFields)}`,
      });
      zohoCustomers = customersResp.data || [];

      const customerIds = uniq((zohoCustomers || []).map((c: any) => c?.id).filter(Boolean));

      if (customerIds.length) {
        const roByCustomer = await Promise.all(
          customerIds.map((id) =>
            makeZohoServerRequest<ZohoListResponse<any>>({
              method: 'GET',
              endpoint: `/${REPAIR_ORDERS_MODULE}/search?criteria=${encodeURIComponent(
                `(Customer:equals:${id})`
              )}&fields=${encodeURIComponent(roFields)}`,
            })
          )
        );

        zohoRepairOrders = roByCustomer.flatMap((r) => r.data || []);
      }
    } else if (isLikelyVin(q)) {
      const vin = qVin;

      const vehicleCriteria = `(Vin:equals:${vin})`;

      const vehiclesResp = await makeZohoServerRequest<ZohoListResponse<any>>({
        method: 'GET',
        endpoint: `/${VEHICLES_MODULE}/search?criteria=${encodeURIComponent(
          vehicleCriteria
        )}&fields=${encodeURIComponent(vehicleFields)}`,
      });

      zohoVehicles = vehiclesResp.data || [];

      const vehicleIds = uniq((zohoVehicles || []).map((v: any) => v?.id).filter(Boolean));
      if (vehicleIds.length) {
        const roByVehicle = await Promise.all(
          vehicleIds.map((id) =>
            makeZohoServerRequest<ZohoListResponse<any>>({
              method: 'GET',
              endpoint: `/${REPAIR_ORDERS_MODULE}/search?criteria=${encodeURIComponent(
                `(Vehicle:equals:${id})`
              )}&fields=${encodeURIComponent(roFields)}`,
            })
          )
        );

        zohoRepairOrders = roByVehicle.flatMap((r) => r.data || []);
      }
    } else {
      const text = q;

      const safeText = tokenize(text)
        .map((t) => t.replace(/[()]/g, ' '))
        .join(' ')
        .trim();

      const word = encodeURIComponent(safeText);

      const [customersData, vehiclesData, repairOrdersData] = await Promise.all([
        safeGetList('customersWord', `/${CONTACTS_MODULE}/search?word=${word}&fields=${encodeURIComponent(customerFields)}`),
        safeGetList('vehiclesWord', `/${VEHICLES_MODULE}/search?word=${word}&fields=${encodeURIComponent(vehicleFields)}`),
        safeGetList(
          'repairOrdersWord',
          `/${REPAIR_ORDERS_MODULE}/search?word=${word}&fields=${encodeURIComponent(roFields)}`
        ),
      ]);

      zohoCustomers = customersData;
      zohoVehicles = vehiclesData;
      zohoRepairOrders = repairOrdersData;
    }

    const customers = (zohoCustomers || []).slice(0, limit).map((z) => {
      const c = normalizeCustomer(z);
      const name = `${c.first_name} ${c.last_name}`.trim() || c.phone || c.email || c.id;
      const out: CustomerResult = { id: c.id, name };
      if (c.phone) out.phone = c.phone;
      if (c.email) out.email = c.email;
      return out;
    });

    const vehiclesNormalized = (zohoVehicles || []).map(normalizeVehicle);

    const vehicleCustomerIds = uniq(
      vehiclesNormalized.map((v) => v.customer_id).filter(Boolean)
    ).slice(0, 20);

    const customersById: Record<string, any> = {};

    if (vehicleCustomerIds.length) {
      const got = await Promise.all(
        vehicleCustomerIds.map((id) =>
          makeZohoServerRequest<any>({
            method: 'GET',
            endpoint: `/${CONTACTS_MODULE}/${id}?fields=${encodeURIComponent(customerFields)}`,
          })
        )
      );

      got.forEach((r) => {
        const z = r?.data?.[0];
        if (z?.id) customersById[z.id] = normalizeCustomer(z);
      });
    }

    const vehicles: VehicleResult[] = vehiclesNormalized.slice(0, limit).map((v) => {
      const display = [v.year, v.make, v.model].filter(Boolean).join(' ') || v.id;
      const c = v.customer_id ? customersById[v.customer_id] : null;
      const out: VehicleResult = {
        id: v.id,
        display,
        vin: v.vin || undefined,
        plate: v.license_plate || undefined,
      };
      if (c) {
        const name = `${c.first_name} ${c.last_name}`.trim();
        if (name) out.customerName = name;
        if (c.phone) out.customerPhone = c.phone;
      }
      return out;
    });

    const repairOrdersNormalized = (zohoRepairOrders || []).map(normalizeRepairOrder);
    const roVehicleIds = uniq(repairOrdersNormalized.map((r) => r.vehicle_id).filter(Boolean)).slice(0, 30);

    const vehiclesById: Record<string, any> = {};

    if (roVehicleIds.length) {
      const got = await Promise.all(
        roVehicleIds.map((id) =>
          makeZohoServerRequest<any>({
            method: 'GET',
            endpoint: `/${VEHICLES_MODULE}/${id}?fields=${encodeURIComponent(vehicleFields)}`,
          })
        )
      );

      got.forEach((r) => {
        const z = r?.data?.[0];
        if (z?.id) vehiclesById[z.id] = normalizeVehicle(z);
      });

      const roCustomerIds = uniq(
        Object.values(vehiclesById)
          .map((v: any) => v.customer_id)
          .filter(Boolean)
      ).slice(0, 30);

      const gotCustomers = await Promise.all(
        roCustomerIds.map((id) =>
          makeZohoServerRequest<any>({
            method: 'GET',
            endpoint: `/${CONTACTS_MODULE}/${id}?fields=${encodeURIComponent(customerFields)}`,
          })
        )
      );

      gotCustomers.forEach((r) => {
        const z = r?.data?.[0];
        if (z?.id) customersById[z.id] = normalizeCustomer(z);
      });
    }

    const repairOrders: RepairOrderResult[] = repairOrdersNormalized.slice(0, limit).map((r) => {
      const v = r.vehicle_id ? vehiclesById[r.vehicle_id] : null;
      const c = v?.customer_id ? customersById[v.customer_id] : null;

      const out: RepairOrderResult = {
        id: r.id,
        status: r.status,
        serviceType: r.service_type || undefined,
        updatedAt: r.updated_time || undefined,
      };

      if (v) {
        out.vehicleDisplay = [v.year, v.make, v.model].filter(Boolean).join(' ') || undefined;
      }

      if (c) {
        const name = `${c.first_name} ${c.last_name}`.trim();
        if (name) out.customerName = name;
        if (c.phone) out.customerPhone = c.phone;
      }

      return out;
    });

    if (debug && Object.keys(callErrors).length) {
      return NextResponse.json({ customers, vehicles, repairOrders, debug: { callErrors } });
    }

    return NextResponse.json({ customers, vehicles, repairOrders });
  } catch (err: any) {
    const s = err?.response?.status || 500;

    if (debug) {
      return NextResponse.json(
        {
          error: 'Failed to search CRM',
          status: s,
          details: err?.response?.data || err?.message || String(err),
        },
        { status: s }
      );
    }

    return NextResponse.json({ error: 'Failed to search CRM' }, { status: s });
  }
};

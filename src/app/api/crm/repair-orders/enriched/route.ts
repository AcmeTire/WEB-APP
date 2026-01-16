import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import {
  normalizeCustomer,
  normalizeRepairOrder,
  normalizeVehicle,
  ZohoListResponse,
} from '../../_shared';

const CONTACTS_MODULE = 'Contacts';
const VEHICLES_MODULE = 'Vehicles';
const REPAIR_ORDERS_MODULE = 'Repair_Orders';

export const GET = async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status');
  const page = req.nextUrl.searchParams.get('page') || '1';
  const perPage = req.nextUrl.searchParams.get('perPage') || '20';

  const roFields = [
    'id',
    'Name',
    'Status',
    'Note',
    'Job_Description',
    'Estimated_Total',
    'Final_Charge_Total',
    'Vehicle',
    'Customer',
    'Created_Time',
    'Modified_Time',
  ].join(',');

  const baseParams = new URLSearchParams({
    page,
    per_page: perPage,
    fields: roFields,
  });

  const endpoint = status
    ? `/${REPAIR_ORDERS_MODULE}/search?${new URLSearchParams({
        criteria: `(Status:equals:${status})`,
        ...Object.fromEntries(baseParams.entries()),
      }).toString()}`
    : `/${REPAIR_ORDERS_MODULE}?${baseParams.toString()}`;

  try {
    const resp = await makeZohoServerRequest<ZohoListResponse<any>>({
      method: 'GET',
      endpoint,
    });

    const orders = (resp.data || []).map(normalizeRepairOrder);
    const vehicleIds = Array.from(new Set(orders.map((o) => o.vehicle_id).filter(Boolean)));

    const vehiclesById: Record<string, any> = {};
    const customersById: Record<string, any> = {};

    if (vehicleIds.length) {
      const vFields = ['id', 'Name', 'Make', 'Model', 'Vin', 'Owner1'].join(',');
      const vs = await Promise.all(
        vehicleIds.map((id) =>
          makeZohoServerRequest<any>({
            method: 'GET',
            endpoint: `/${VEHICLES_MODULE}/${id}?fields=${encodeURIComponent(vFields)}`,
          })
        )
      );

      vs.forEach((r) => {
        const v = r?.data?.[0];
        if (v?.id) vehiclesById[v.id] = normalizeVehicle(v);
      });

      const customerIds = Array.from(
        new Set(Object.values(vehiclesById).map((v: any) => v.customer_id).filter(Boolean))
      );

      if (customerIds.length) {
        const cFields = ['id', 'First_Name', 'Last_Name', 'Phone', 'Email'].join(',');
        const cs = await Promise.all(
          customerIds.map((id) =>
            makeZohoServerRequest<any>({
              method: 'GET',
              endpoint: `/${CONTACTS_MODULE}/${id}?fields=${encodeURIComponent(cFields)}`,
            })
          )
        );

        cs.forEach((r) => {
          const c = r?.data?.[0];
          if (c?.id) customersById[c.id] = normalizeCustomer(c);
        });
      }
    }

    const enriched = orders.map((o) => {
      const vehicle = vehiclesById[o.vehicle_id] || null;
      const customer = vehicle?.customer_id ? customersById[vehicle.customer_id] || null : null;
      return { repairOrder: o, vehicle, customer };
    });

    return NextResponse.json({ data: enriched, info: resp.info });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch repair orders' }, { status: 500 });
  }
};

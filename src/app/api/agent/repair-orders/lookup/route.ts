import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import {
  auditLog,
  getRequestId,
  jsonError,
  normalizePhone,
  requireAgentKey,
  zohoLookupCustomerByPhone,
} from '../../_shared';
import { normalizeCustomer, normalizeRepairOrder, normalizeVehicle, ZohoListResponse } from '../../../crm/_shared';

const CONTACTS_MODULE = 'Contacts';
const VEHICLES_MODULE = 'Vehicles';
const REPAIR_ORDERS_MODULE = 'Repair_Orders';

export const POST = async (req: NextRequest) => {
  const requestId = getRequestId(req);
  const auth = requireAgentKey(req);
  if (!auth.ok) {
    auditLog({ requestId, action: 'repair_orders.lookup', success: false, status: 401, error: 'unauthorized' });
    return auth.response;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    auditLog({ requestId, action: 'repair_orders.lookup', success: false, status: 400, error: 'invalid_json' });
    return jsonError(400, 'Invalid JSON');
  }

  const phone = normalizePhone(body?.phone);
  const customerId = typeof body?.customerId === 'string' ? body.customerId.trim() : '';
  const status = typeof body?.status === 'string' ? body.status.trim() : '';

  if (!phone && !customerId && !status) {
    auditLog({ requestId, action: 'repair_orders.lookup', success: false, status: 400, error: 'missing_criteria' });
    return jsonError(400, 'At least one lookup field is required', {
      requiredOneOf: ['phone', 'customerId', 'status'],
    });
  }

  try {
    let resolvedCustomerId = customerId;
    let resolvedCustomer: any = null;

    if (!resolvedCustomerId && phone) {
      resolvedCustomer = await zohoLookupCustomerByPhone(phone);
      resolvedCustomerId = resolvedCustomer?.id || '';
    }

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
      page: '1',
      per_page: '50',
      fields: roFields,
    });

    let endpoint: string;

    if (status) {
      endpoint = `/${REPAIR_ORDERS_MODULE}/search?${new URLSearchParams({
        criteria: `(Status:equals:${status})`,
        ...Object.fromEntries(baseParams.entries()),
      }).toString()}`;
    } else {
      endpoint = `/${REPAIR_ORDERS_MODULE}?${baseParams.toString()}`;
    }

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

    const items = orders
      .map((o) => {
        const vehicle = vehiclesById[o.vehicle_id] || null;
        const customer = vehicle?.customer_id ? customersById[vehicle.customer_id] || null : null;

        if (resolvedCustomerId && customer?.id !== resolvedCustomerId) return null;

        const vehicleDisplay = vehicle ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') : '';
        const customerName = customer ? `${customer.first_name} ${customer.last_name}`.trim() : '';

        return {
          id: o.id,
          status: o.status,
          serviceType: o.service_type || '',
          vehicleDisplay,
          customerName,
          customerPhone: customer?.phone || '',
        };
      })
      .filter(Boolean);

    auditLog({ requestId, action: 'repair_orders.lookup', success: true, status: 200, customerId: resolvedCustomerId || undefined });

    return NextResponse.json({ data: items, count: items.length, requestId });
  } catch (err: any) {
    auditLog({ requestId, action: 'repair_orders.lookup', success: false, status: 500, error: 'zoho_error' });
    return jsonError(500, 'Failed to lookup repair orders');
  }
};

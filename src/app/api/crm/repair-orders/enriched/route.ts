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

let lastCacheKey: string | null = null;
let lastCacheAt = 0;
let lastCachePayload: any = null;

const CACHE_TTL_MS = 10_000;

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let i = 0;

  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }).map(
    async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]);
      }
    }
  );

  await Promise.all(workers);
  return results;
};

export const GET = async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status');
  const page = req.nextUrl.searchParams.get('page') || '1';
  const perPage = req.nextUrl.searchParams.get('perPage') || '20';

  const cacheKey = `${status || ''}|${page}|${perPage}`;
  if (
    lastCacheKey === cacheKey &&
    lastCachePayload &&
    Date.now() - lastCacheAt < CACHE_TTL_MS
  ) {
    return NextResponse.json(lastCachePayload);
  }

  const roFields = [
    'id',
    'Name',
    'Status',
    'Note',
    'Job_Description',
    'Estimated_Total',
    'Final_Charge_Total',
    'Estimated_Completion',
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

  try {
    const resp = await makeZohoServerRequest<ZohoListResponse<any>>({
      method: 'GET',
      endpoint: `/${REPAIR_ORDERS_MODULE}?${baseParams.toString()}`,
    });

    const targetStatus = typeof status === 'string' ? status.trim() : '';
    const orders = (resp.data || [])
      .map(normalizeRepairOrder)
      .filter((o) => (!targetStatus ? true : o.status === targetStatus));
    const vehicleIds = Array.from(new Set(orders.map((o) => o.vehicle_id).filter(Boolean)));

    const vehiclesById: Record<string, any> = {};
    const customersById: Record<string, any> = {};

    if (vehicleIds.length) {
      const vFields = ['id', 'Name', 'Make', 'Model', 'Vin', 'Owner1'].join(',');
      const vs = await mapWithConcurrency(vehicleIds, 6, (id) =>
        makeZohoServerRequest<any>({
          method: 'GET',
          endpoint: `/${VEHICLES_MODULE}/${id}?fields=${encodeURIComponent(vFields)}`,
        })
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
        const cs = await mapWithConcurrency(customerIds, 6, (id) =>
          makeZohoServerRequest<any>({
            method: 'GET',
            endpoint: `/${CONTACTS_MODULE}/${id}?fields=${encodeURIComponent(cFields)}`,
          })
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

    const payload = { data: enriched, info: resp.info };
    lastCacheKey = cacheKey;
    lastCacheAt = Date.now();
    lastCachePayload = payload;

    return NextResponse.json(payload);
  } catch (err: any) {
    const statusCode = err?.response?.status;
    const data = err?.response?.data;
    console.error('repair-orders/enriched error', {
      status: statusCode,
      data,
      message: err?.message,
    });

    lastCacheKey = null;
    lastCacheAt = 0;
    lastCachePayload = null;

    return NextResponse.json(
      {
        error: 'Failed to fetch repair orders',
        status: statusCode || 500,
        details: data || err?.message || null,
      },
      { status: statusCode || 500 }
    );
  }
};

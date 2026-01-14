
import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeRepairOrder, ZohoListResponse } from '../_shared';

const REPAIR_ORDERS_MODULE = 'Repair_Orders';

export const GET = async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status');
  const page = req.nextUrl.searchParams.get('page') || '1';
  const perPage = req.nextUrl.searchParams.get('perPage') || '20';

  const fields = [
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

  const params = new URLSearchParams({
    page,
    per_page: perPage,
    fields,
  });

  if (status) params.set('Status', status);

  try {
    const resp = await makeZohoServerRequest<ZohoListResponse<any>>({
      method: 'GET',
      endpoint: `/${REPAIR_ORDERS_MODULE}?${params.toString()}`,
    });

    return NextResponse.json({
      data: (resp.data || []).map(normalizeRepairOrder),
      info: resp.info,
    });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch repair orders' }, { status: s });
  }
};

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const vehicleId = body?.vehicle_id;
  const status = body?.status;
  const serviceType = body?.service_type;
  const jobDescription = body?.job_description;
  const note = body?.note;
  const notes = body?.notes;
  const customerId = body?.customer_id;

  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicle_id is required' }, { status: 400 });
  }

  const payload = {
    data: [
      {
        Name: serviceType || `RO-${Date.now()}`,
        Status: status || 'New',
        Note: note || notes || '',
        Job_Description: jobDescription || notes || '',
        Vehicle: vehicleId,
        ...(customerId ? { Customer: customerId } : {}),
      },
    ],
  };

  try {
    const created = await makeZohoServerRequest<any>({
      method: 'POST',
      endpoint: `/${REPAIR_ORDERS_MODULE}`,
      data: payload,
    });

    const id = created?.data?.[0]?.details?.id;
    if (!id) {
      return NextResponse.json({ error: 'Failed to create repair order' }, { status: 500 });
    }

    const fields = [
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

    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: `/${REPAIR_ORDERS_MODULE}/${id}?fields=${encodeURIComponent(fields)}`,
    });

    return NextResponse.json({ data: normalizeRepairOrder(got.data?.[0]) }, { status: 201 });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to create repair order' }, { status: s });
  }
};

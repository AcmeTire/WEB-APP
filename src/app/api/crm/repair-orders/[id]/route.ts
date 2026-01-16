
import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeRepairOrder } from '../../_shared';

const REPAIR_ORDERS_MODULE = 'Repair_Orders';

const FIELDS = [
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

export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: `/${REPAIR_ORDERS_MODULE}/${id}?fields=${encodeURIComponent(FIELDS)}`,
    });

    return NextResponse.json({ data: normalizeRepairOrder(got.data?.[0]) });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch repair order' }, { status: s });
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await req.json();

  const payload = {
    data: [
      {
        id,
        ...(body?.status ? { Status: body.status } : {}),
        ...(body?.service_type ? { Name: body.service_type } : {}),
        ...(body?.note !== undefined ? { Note: body.note } : {}),
        ...(body?.job_description !== undefined ? { Job_Description: body.job_description } : {}),
        ...(body?.notes !== undefined ? { Note: body.notes, Job_Description: body.notes } : {}),
        ...(typeof body?.estimated_total === 'number' ? { Estimated_Total: body.estimated_total } : {}),
        ...(typeof body?.final_charge_total === 'number' ? { Final_Charge_Total: body.final_charge_total } : {}),
      },
    ],
  };

  try {
    await makeZohoServerRequest<any>({
      method: 'PUT',
      endpoint: `/${REPAIR_ORDERS_MODULE}`,
      data: payload,
    });

    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: `/${REPAIR_ORDERS_MODULE}/${id}?fields=${encodeURIComponent(FIELDS)}`,
    });

    return NextResponse.json({ data: normalizeRepairOrder(got.data?.[0]) });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to update repair order' }, { status: s });
  }
};

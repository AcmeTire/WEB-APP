import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeVehicle } from '../../_shared';

const VEHICLES_MODULE = 'Vehicles';

const FIELDS = ['id', 'Name', 'Make', 'Model', 'Vin', 'License_Plate', 'Owner1'].join(',');

export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  try {
    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: `/${VEHICLES_MODULE}/${id}?fields=${encodeURIComponent(FIELDS)}`,
    });

    return NextResponse.json({ data: normalizeVehicle(got.data?.[0]) });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: s });
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await req.json();

  const payload = {
    data: [
      {
        id,
        ...(body?.vin !== undefined ? { Vin: body.vin || '' } : {}),
        ...(body?.license_plate !== undefined ? { License_Plate: body.license_plate || '' } : {}),
        ...(body?.customer_id ? { Owner1: body.customer_id } : {}),
      },
    ],
  };

  try {
    await makeZohoServerRequest<any>({
      method: 'PUT',
      endpoint: `/${VEHICLES_MODULE}`,
      data: payload,
    });

    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: `/${VEHICLES_MODULE}/${id}?fields=${encodeURIComponent(FIELDS)}`,
    });

    return NextResponse.json({ data: normalizeVehicle(got.data?.[0]) });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: s });
  }
};

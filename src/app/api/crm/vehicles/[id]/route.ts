import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeVehicle } from '../../_shared';

const VEHICLES_MODULE = 'Vehicles';

const FIELDS = ['id', 'Name', 'Make', 'Model', 'Vin', 'License_Plate', 'Engine_Size', 'Owner1'].join(',');

export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const full = _req.nextUrl.searchParams.get('full') === '1';

  try {
    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: full ? `/${VEHICLES_MODULE}/${id}` : `/${VEHICLES_MODULE}/${id}?fields=${encodeURIComponent(FIELDS)}`,
    });

    const raw = got.data?.[0];
    return NextResponse.json({ data: normalizeVehicle(raw), raw });
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
        ...(body?.year !== undefined ? { Name: body.year || '' } : {}),
        ...(body?.make !== undefined ? { Make: body.make || '' } : {}),
        ...(body?.model !== undefined ? { Model: body.model || '' } : {}),
        ...(body?.vin !== undefined ? { Vin: body.vin || '' } : {}),
        ...(body?.license_plate !== undefined ? { License_Plate: body.license_plate || '' } : {}),
        ...(body?.engine_size !== undefined ? { Engine_Size: body.engine_size || '' } : {}),
        ...(body?.customer_id ? { Owner1: body.customer_id } : {}),
        ...(body?.rawUpdates && typeof body.rawUpdates === 'object' ? body.rawUpdates : {}),
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

    const raw = got.data?.[0];
    return NextResponse.json({ data: normalizeVehicle(raw), raw });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: s });
  }
};

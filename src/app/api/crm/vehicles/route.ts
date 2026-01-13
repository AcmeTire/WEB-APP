
import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeVehicle } from '../_shared';

const VEHICLES_MODULE = 'Vehicles';

const FIELDS = ['id', 'Year', 'Make', 'Model', 'VIN', 'Customer'].join(',');

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const payload = {
    data: [
      {
        Year: body?.year || '',
        Make: body?.make || '',
        Model: body?.model || '',
        VIN: body?.vin || '',
        Customer: body?.customer_id || undefined,
      },
    ],
  };

  if (!payload.data[0].VIN) {
    return NextResponse.json({ error: 'vin is required' }, { status: 400 });
  }

  try {
    const created = await makeZohoServerRequest<any>({
      method: 'POST',
      endpoint: `/${VEHICLES_MODULE}`,
      data: payload,
    });

    const id = created?.data?.[0]?.details?.id;
    if (!id) {
      return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }

    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: `/${VEHICLES_MODULE}/${id}?fields=${encodeURIComponent(FIELDS)}`,
    });

    return NextResponse.json({ data: normalizeVehicle(got.data?.[0]) }, { status: 201 });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: s });
  }
};

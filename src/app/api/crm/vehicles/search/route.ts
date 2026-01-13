
import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeVehicle, ZohoListResponse } from '../../_shared';

const VEHICLES_MODULE = 'Vehicles';

export const GET = async (req: NextRequest) => {
  const vin = req.nextUrl.searchParams.get('vin');
  if (!vin) {
    return NextResponse.json({ error: 'vin is required' }, { status: 400 });
  }

  const fields = ['id', 'Year', 'Make', 'Model', 'VIN', 'Customer'].join(',');

  try {
    const resp = await makeZohoServerRequest<ZohoListResponse<any>>({
      method: 'GET',
      endpoint: `/${VEHICLES_MODULE}/search?criteria=(VIN:equals:${encodeURIComponent(vin)})&fields=${encodeURIComponent(fields)}`,
    });

    const v = resp.data?.[0] ? normalizeVehicle(resp.data[0]) : null;
    return NextResponse.json({ data: v });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to search vehicle' }, { status: s });
  }
};

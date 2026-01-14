import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeVehicle, ZohoListResponse } from '../../_shared';

const VEHICLES_MODULE = 'Vehicles';

export const GET = async (req: NextRequest) => {
  const customerId = req.nextUrl.searchParams.get('customer_id');
  if (!customerId) {
    return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
  }

  const fields = ['id', 'Name', 'Make', 'Model', 'Vin', 'License_Plate', 'Owner1'].join(',');

  try {
    const resp = await makeZohoServerRequest<ZohoListResponse<any>>({
      method: 'GET',
      endpoint: `/${VEHICLES_MODULE}/search?criteria=(Owner1:equals:${encodeURIComponent(
        customerId
      )})&fields=${encodeURIComponent(fields)}`,
    });

    return NextResponse.json({ data: (resp.data || []).map(normalizeVehicle), info: resp.info });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: s });
  }
};

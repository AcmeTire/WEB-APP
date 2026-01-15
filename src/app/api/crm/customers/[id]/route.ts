import { NextRequest, NextResponse } from 'next/server';
import { makeZohoServerRequest } from '@/lib/zoho/request-server';
import { normalizeCustomer } from '../../_shared';

const CONTACTS_MODULE = 'Contacts';

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const full = req.nextUrl.searchParams.get('full') === '1';

  try {
    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: full ? `/${CONTACTS_MODULE}/${id}` : `/${CONTACTS_MODULE}/${id}?fields=${encodeURIComponent('id,First_Name,Last_Name,Phone,Email')}`,
    });

    const raw = got?.data?.[0];
    return NextResponse.json({ data: normalizeCustomer(raw), raw });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: s });
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await req.json();

  const data: Record<string, any> = {
    id,
    ...(body?.first_name !== undefined ? { First_Name: body.first_name || '' } : {}),
    ...(body?.last_name !== undefined ? { Last_Name: body.last_name || '' } : {}),
    ...(body?.phone !== undefined ? { Phone: body.phone || '' } : {}),
    ...(body?.email !== undefined ? { Email: body.email || '' } : {}),
    ...(body?.rawUpdates && typeof body.rawUpdates === 'object' ? body.rawUpdates : {}),
  };

  const payload = { data: [data] };

  try {
    await makeZohoServerRequest<any>({
      method: 'PUT',
      endpoint: `/${CONTACTS_MODULE}`,
      data: payload,
    });

    const got = await makeZohoServerRequest<any>({
      method: 'GET',
      endpoint: `/${CONTACTS_MODULE}/${id}`,
    });

    const raw = got?.data?.[0];
    return NextResponse.json({ data: normalizeCustomer(raw), raw });
  } catch (err: any) {
    const s = err?.response?.status || 500;
    return NextResponse.json({ error: 'Failed to update customer' }, { status: s });
  }
};

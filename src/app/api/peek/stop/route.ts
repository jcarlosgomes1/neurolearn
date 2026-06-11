import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') || 'pt';
  const res = NextResponse.redirect(new URL(`/${locale}/admin`, req.url));
  res.cookies.set('nl_peek', '', { path: '/', maxAge: 0 });
  return res;
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const role = sp.get('as') === 'instrutor' ? 'instrutor' : 'aluno';
  const locale = sp.get('locale') || 'pt';

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }
  const { data: isAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isAdmin) {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  const dest = role === 'instrutor' ? `/${locale}/teach` : `/${locale}/learn`;
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set('nl_peek', role, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  return res;
}

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  // 1) Sign out via Supabase (server context with cookies)
  try {
    const sb = await createClient();
    await sb.auth.signOut({ scope: 'global' });
  } catch (e) {
    // silent — continue with cookie cleanup
  }

  // 2) Force-delete all sb-* and supabase-related cookies on the response
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') || 'pt';
  const next = url.searchParams.get('next') || `/${locale}`;

  const response = NextResponse.redirect(new URL(next, req.url));

  for (const c of allCookies) {
    if (c.name.startsWith('sb-') || c.name.includes('supabase') || c.name.startsWith('nl-')) {
      response.cookies.set(c.name, '', { maxAge: 0, path: '/', expires: new Date(0) });
    }
  }

  // Also clear via Set-Cookie for the root path explicitly
  response.cookies.set('sb-access-token', '', { maxAge: 0, path: '/', expires: new Date(0) });
  response.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/', expires: new Date(0) });

  return response;
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }

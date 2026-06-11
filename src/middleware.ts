import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED: Array<{ pattern: RegExp; required: 'student' | 'instructor' | 'admin' | 'any' }> = [
  { pattern: /^\/(pt|en|es|fr)\/learn(\/.*)?$/, required: 'any' },
  { pattern: /^\/(pt|en|es|fr)\/teach(\/.*)?$/, required: 'instructor' },
  { pattern: /^\/(pt|en|es|fr)\/admin(\/.*)?$/, required: 'admin' },
];

let _pm = { v: false, at: 0 };
async function privateModeOn(): Promise<boolean> {
  const now = Date.now();
  if (now - _pm.at < 60000) return _pm.v;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const res = await fetch(`${url}/rest/v1/nl_feature_flags?key=eq.private_mode&select=enabled`, {
      headers: { apikey: key as string, Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const rows = await res.json();
      _pm = { v: !!(rows[0] && rows[0].enabled), at: now };
    } else {
      _pm = { v: _pm.v, at: now };
    }
  } catch {
    _pm = { v: _pm.v, at: now };
  }
  return _pm.v;
}

const PRIVATE_ALLOW = /(^\/(pt|en|es|fr)\/(login|em-breve)(\/|$))|(\/auth(\/|$))/;

export async function middleware(request: NextRequest) {
  const { user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (!user && !PRIVATE_ALLOW.test(path)) {
    if (await privateModeOn()) {
      const seg = path.split('/')[1];
      const locale = ['pt', 'en', 'es', 'fr'].includes(seg) ? seg : 'pt';
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/em-breve`;
      return NextResponse.redirect(url);
    }
  }

  const protectedRoute = PROTECTED.find((r) => r.pattern.test(path));
  if (protectedRoute && !user) {
    const locale = path.split('/')[1] || 'pt';
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set('redirect_to', path);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};

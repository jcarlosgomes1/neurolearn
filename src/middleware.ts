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

export async function middleware(request: NextRequest) {
  // 1. Refresh session
  const { user } = await updateSession(request);

  // 2. Auth guard
  const path = request.nextUrl.pathname;
  const protectedRoute = PROTECTED.find((r) => r.pattern.test(path));

  if (protectedRoute && !user) {
    const locale = path.split('/')[1] || 'pt';
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set('redirect_to', path);
    return NextResponse.redirect(url);
  }

  // 3. i18n routing
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handles OAuth redirect from Supabase Auth providers.
// Supabase appends ?code=... which we exchange for a session cookie.
export async function GET(request: NextRequest, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '';
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    const dest = `/${locale}/login?error=${encodeURIComponent(error)}${errorDescription ? '&error_description=' + encodeURIComponent(errorDescription) : ''}`;
    return NextResponse.redirect(new URL(dest, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=no_code`, url.origin));
  }

  const sb = await createClient();
  const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=${encodeURIComponent(exchangeError.message)}`, url.origin));
  }

  // Determine destination based on profile (admin → /admin, instructor → /teach, else → /learn)
  const { data: { user } } = await sb.auth.getUser();
  let dest = next || `/${locale}/learn`;
  if (!next && user) {
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role === 'admin' || profile?.role === 'super_admin') dest = `/${locale}/admin`;
    else if (profile?.role === 'instructor') dest = `/${locale}/teach`;
  }

  return NextResponse.redirect(new URL(dest, url.origin));
}

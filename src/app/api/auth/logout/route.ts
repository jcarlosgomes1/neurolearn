import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  // 1) Server-side signOut (revoga refresh_tokens no Supabase)
  let userId: string | null = null;
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    userId = user?.id || null;
    await sb.auth.signOut({ scope: 'global' });
  } catch {}

  // 2) Construir response com redirect
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/pt';
  const response = NextResponse.redirect(new URL(next, req.url), { status: 303 });

  // 3) Clear-Site-Data: instrução nativa ao browser para limpar TUDO
  //    Funciona em Chrome/Edge/Firefox modernos — apaga cookies, storage, cache
  response.headers.set('Clear-Site-Data', '"cookies", "storage"');

  // 4) Cache disable para forçar reload
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');

  // 5) Belt and braces: apagar cookies manualmente (fallback para browsers antigos)
  try {
    const cookieStore = await cookies();
    for (const c of cookieStore.getAll()) {
      if (c.name.startsWith('sb-') || c.name.includes('supabase') || c.name.startsWith('nl-')) {
        // tenta apagar com várias combinações path/sameSite (browsers exigem match)
        response.cookies.set(c.name, '', { maxAge: 0, path: '/', expires: new Date(0) });
        response.cookies.set(c.name, '', { maxAge: 0, path: '/', expires: new Date(0), sameSite: 'lax' });
      }
    }
  } catch {}

  return response;
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }

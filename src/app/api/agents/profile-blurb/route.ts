import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Descontinuada: a geração do perfil corre na base de dados
// (RPCs nl_profile_blurb_enqueue / nl_profile_blurb_collect via pg_net),
// porque o ambiente Vercel nao tem SUPABASE_SERVICE_ROLE_KEY.
export async function POST() {
  return NextResponse.json({ ok: false, error: 'deprecated', use: 'rpc:nl_profile_blurb_enqueue' }, { status: 410 });
}

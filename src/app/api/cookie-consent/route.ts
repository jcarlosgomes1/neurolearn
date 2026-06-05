import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sb = await createClient();
    const ua = req.headers.get('user-agent') || null;
    
    const { data, error } = await sb.rpc('nl_cookie_consent_set', {
      p_necessary: true,
      p_analytics: Boolean(body.analytics),
      p_marketing: Boolean(body.marketing),
      p_functional: Boolean(body.functional),
      p_session_id: body.session_id || null,
      p_consent_version: body.consent_version || '1.0',
      p_user_agent: ua,
    });
    
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

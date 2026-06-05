import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    
    await sb.from('nl_client_telemetry').insert({
      user_id: user?.id || null,
      event: 'error_boundary',
      context: body.url || 'unknown',
      data: {
        message: (body.message || '').slice(0, 500),
        stack: (body.stack || '').slice(0, 2000),
        digest: body.digest,
      },
    }).then(() => {}, () => {});
    
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

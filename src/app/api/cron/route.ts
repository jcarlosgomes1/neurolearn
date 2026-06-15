import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Relógio único (externo) -> despacha as tarefas que estão "due" segundo nl_scheduled_tasks.
// Cadências 100% na config (editáveis no backoffice). NÃO há cron na base de dados.
// Protegido por CRON_SECRET (Authorization: Bearer <CRON_SECRET>).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const sb = createAdminClient();
  try {
    const { data, error } = await sb.rpc('nl_run_due_scheduled_tasks');
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, ran_at: new Date().toISOString(), tasks_executed: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

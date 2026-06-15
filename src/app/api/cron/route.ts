import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Relógio único (Vercel Cron) para o trabalho temporal: agendar + publicar + gerar propostas.
// A CADÊNCIA de negócio vive na config da BD (nl_platform_config); aqui só está o gatilho.
// Protegido por CRON_SECRET: o Vercel Cron envia "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const sb = createAdminClient();
  const steps: [string, string][] = [
    ['social_schedule', 'nl_social_schedule_pending'],
    ['social_publish', 'nl_publish_scheduled_social'],
    ['blog_schedule', 'nl_blog_schedule_pending'],
    ['blog_publish', 'nl_publish_scheduled_blog'],
    ['agents_generate', 'nl_agents_generate_tick'],
  ];

  const results: Record<string, unknown> = {};
  for (const [key, fn] of steps) {
    try {
      const { data, error } = await sb.rpc(fn);
      results[key] = error ? { error: error.message } : data;
    } catch (e) {
      results[key] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({ ok: true, ran_at: new Date().toISOString(), results });
}

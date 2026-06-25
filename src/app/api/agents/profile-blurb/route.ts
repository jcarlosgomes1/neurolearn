import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Worker do "perfil curado": gera proposta multilingue {headline, blurb} via Anthropic.
// Config 100% em nl_agent_settings; chave em nl_secrets. Zero hardcode.
// Auth: Bearer AGENT_OPS_KEY (modo serviço/agente) OU sessao do proprio utilizador.

async function getSecret(sb: any, key: string): Promise<string | undefined> {
  const { data } = await sb.from('nl_secrets').select('value').eq('key', key).maybeSingle();
  return (data?.value as string) || undefined;
}

function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_m, k) => (vars[k] ?? ''));
}

async function generateForUser(sb: any, userId: string) {
  const { data: ctx } = await sb.rpc('nl_profile_blurb_context', { p_user_id: userId });
  if (!ctx) return { ok: false, error: 'no_context' };
  const cfg: Record<string, any> = ctx.config || {};
  if (cfg['profile.blurb.enabled'] === false) return { ok: false, error: 'disabled' };

  const model = cfg['profile.blurb.model'] || 'claude-haiku-4-5-20251001';
  const maxWords = cfg['profile.blurb.max_words'] ?? 45;
  const tone = cfg['profile.blurb.tone'] || '';
  const langs: string[] = Array.isArray(cfg['profile.blurb.langs']) ? cfg['profile.blurb.langs'] : ['pt', 'en', 'es', 'fr'];
  const tpl = cfg['profile.blurb.prompt_template'] || '';

  const apiKey = await getSecret(sb, 'ANTHROPIC_API_KEY');
  if (!apiKey) return { ok: false, error: 'no_api_key' };

  const interestsFor = (lang: string): string =>
    Array.isArray(ctx.interests) ? ctx.interests.map((l: any) => l?.[lang] || l?.pt || '').filter(Boolean).join(', ') : '';
  const expertise = ctx.instructor_bio || '';

  const headline: Record<string, string> = {};
  const blurb: Record<string, string> = {};

  for (const lang of langs) {
    const prompt = fill(tpl, {
      lang, tone, max_words: String(maxWords),
      name: ctx.name || '', role: ctx.role || '', expertise,
      interests: interestsFor(lang), goal: ctx.goal || '', bio: ctx.bio || '',
    });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) {
      const t = await r.text();
      return { ok: false, error: 'llm_' + r.status, detail: t.slice(0, 300) };
    }
    const j: any = await r.json();
    const text = (j?.content?.find((b: any) => b.type === 'text')?.text || '').trim();
    let parsed: any;
    try { parsed = JSON.parse(text.replace(/^```json/i, '').replace(/```$/i, '').trim()); }
    catch { parsed = { headline: '', blurb: text }; }
    headline[lang] = (parsed?.headline || '').trim();
    blurb[lang] = (parsed?.blurb || '').trim();
  }

  await sb.from('nl_profile_public').upsert({
    user_id: userId, proposed_headline: headline, proposed_blurb: blurb,
    status: 'proposed', proposed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  await sb.from('nl_agent_jobs')
    .update({ status: 'completed', completed_at: new Date().toISOString(), result: { headline, blurb } })
    .eq('job_type', 'generate_profile_blurb').eq('status', 'queued').contains('payload', { user_id: userId });

  return { ok: true, status: 'proposed', proposed_headline: headline, proposed_blurb: blurb };
}

export async function POST(req: NextRequest) {
  const sb = createAdminClient();
  let body: any = {};
  try { body = await req.json(); } catch { /* no body */ }

  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const opsKey = await getSecret(sb, 'AGENT_OPS_KEY');

  let userId: string | undefined;

  if (opsKey && bearer && bearer === opsKey) {
    if (body?.user_id) {
      userId = body.user_id;
    } else {
      const { data: job } = await sb.from('nl_agent_jobs')
        .select('id,payload').eq('job_type', 'generate_profile_blurb').eq('status', 'queued')
        .order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (!job) return NextResponse.json({ ok: true, drained: 0 });
      userId = job.payload?.user_id;
    }
  } else {
    const userSb = await createClient();
    const { data: u } = await userSb.auth.getUser();
    if (!u?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    userId = u.user.id;
  }

  if (!userId) return NextResponse.json({ ok: false, error: 'no_user' }, { status: 400 });
  const res = await generateForUser(sb, userId);
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}

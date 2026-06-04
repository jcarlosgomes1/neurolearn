'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getOrgContext(slug: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: org } = await sb.from('nl_organizations').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (!org) return null;
  const { data: m } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!m || !['owner','admin','editor'].includes(m.role)) return null;
  return { sb, org, user, role: m.role };
}

export async function listJobPostingsAction(slug: string) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    const { data, error } = await ctx.sb.from('nl_job_postings').select('*').eq('org_id', ctx.org.id).order('updated_at', { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data || [] };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function upsertJobPostingAction(slug: string, job: Record<string, unknown>) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    const { data, error } = await ctx.sb.rpc('nl_job_posting_upsert', {
      p_id: job.id || null,
      p_org_id: ctx.org.id,
      p_title: job.title, p_description: job.description,
      p_required_skills: job.required_skills, p_nice_to_have_skills: job.nice_to_have_skills,
      p_location: job.location, p_remote_ok: job.remote_ok,
      p_employment_type: job.employment_type,
      p_salary_min_cents: job.salary_min_cents, p_salary_max_cents: job.salary_max_cents,
      p_currency: job.currency || 'EUR', p_status: job.status || 'draft',
    });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string; id?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'failed' };
    revalidatePath(`/[locale]/empresa/${slug}/admin/vagas`, 'page');
    return { ok: true, data: { id: r.id } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function getJobMatchAction(slug: string, jobId: string) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    const [{ data: job }, { data: matches }] = await Promise.all([
      ctx.sb.from('nl_job_postings').select('*').eq('id', jobId).eq('org_id', ctx.org.id).maybeSingle(),
      ctx.sb.rpc('nl_talent_match', { p_job_posting_id: jobId, p_limit: 50 }),
    ]);
    if (!job) return { ok: false, error: 'job_not_found' };
    return { ok: true, data: { job, matches: matches || [] } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

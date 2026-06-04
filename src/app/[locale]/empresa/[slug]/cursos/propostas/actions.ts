'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ActionResult<T = unknown> { ok: boolean; error?: string; data?: T; }

async function getOrgForSlug(slug: string): Promise<{ org_id: string; user_id: string; role: string } | null> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: org } = await sb.from('nl_organizations').select('id').eq('slug', slug).maybeSingle();
  if (!org) return null;
  const { data: membership } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!membership) return null;
  return { org_id: org.id, user_id: user.id, role: membership.role };
}

export async function proposeCourseAction(
  slug: string,
  contentIds: string[],
  targetAudience: 'beginner'|'intermediate'|'advanced'|'executive',
  difficulty: 'easy'|'medium'|'hard',
  sourceLang: string = 'pt'
): Promise<ActionResult<{ proposal_id: string }>> {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden_or_not_found' };
    if (!['owner','admin','editor'].includes(ctx.role)) return { ok: false, error: 'insufficient_role' };
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_org_propose_course', {
      p_org_id: ctx.org_id,
      p_content_ids: contentIds,
      p_target_audience: targetAudience,
      p_difficulty: difficulty,
      p_source_lang: sourceLang,
    });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string; proposal_id?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'propose_failed' };
    revalidatePath(`/[locale]/empresa/${slug}/cursos/propostas`, 'page');
    return { ok: true, data: { proposal_id: r.proposal_id! } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function listProposalsAction(slug: string) {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_org_proposals_list', { p_org_id: ctx.org_id });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data || [] };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function getProposalAction(slug: string, proposalId: string) {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_org_proposal_get', { p_proposal_id: proposalId });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'fetch_failed' };
    return { ok: true, data };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function approveProposalAction(slug: string, proposalId: string): Promise<ActionResult<{ course_id: string }>> {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_org_proposal_approve', { p_proposal_id: proposalId });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string; course_id?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'approve_failed' };
    revalidatePath(`/[locale]/empresa/${slug}/cursos/propostas`, 'page');
    revalidatePath(`/[locale]/empresa/${slug}/cursos/propostas/${proposalId}`, 'page');
    return { ok: true, data: { course_id: r.course_id! } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function rejectProposalAction(slug: string, proposalId: string, reason?: string): Promise<ActionResult> {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_org_proposal_reject', { p_proposal_id: proposalId, p_reason: reason || null });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'reject_failed' };
    revalidatePath(`/[locale]/empresa/${slug}/cursos/propostas`, 'page');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

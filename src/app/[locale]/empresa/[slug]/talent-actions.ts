'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function browseTalentAction(orgId: string, filters: {
  skills?: string[]; search?: string; remoteOk?: boolean; location?: string; maxSalaryCents?: number;
}) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_talent_browse_for_org', {
    p_org_id: orgId,
    p_skills: filters.skills && filters.skills.length > 0 ? filters.skills : null,
    p_search: filters.search || null,
    p_remote_ok: filters.remoteOk ?? null,
    p_location: filters.location || null,
    p_max_salary_cents: filters.maxSalaryCents || null,
    p_limit: 50, p_offset: 0,
  });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function createPlacementAction(orgId: string, userId: string, jobPostingId?: string, notes?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_talent_placement_create', {
    p_org_id: orgId, p_user_id: userId, p_job_posting_id: jobPostingId || null, p_notes: notes || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/empresa', 'layout');
  return data as any;
}

export async function updatePlacementStatusAction(placementId: string, pipelineStatus: string, annualSalaryCents?: number, feePct?: number, notes?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_talent_placement_update_status', {
    p_placement_id: placementId, p_pipeline_status: pipelineStatus,
    p_annual_salary_cents: annualSalaryCents || null, p_placement_fee_pct: feePct || null,
    p_notes: notes || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/empresa', 'layout');
  return data as any;
}

export async function listOrgPlacementsAction(orgId: string, pipelineStatus?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_talent_placements_list_for_org', {
    p_org_id: orgId, p_pipeline_status: pipelineStatus || null,
  });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function myPlacementsAction() {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_talent_my_placements');
  if (error) return { ok: false, error: error.message };
  return data as any;
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function listOrgsAction(filters: {
  search?: string;
  plan?: string;
  status?: string;
  includeArchived?: boolean;
}) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_orgs_list', {
    p_search: filters.search || null,
    p_plan: filters.plan || null,
    p_status: filters.status || null,
    p_include_archived: filters.includeArchived || false,
    p_limit: 200,
    p_offset: 0,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as any };
}

export async function createOrgAction(input: {
  name: string;
  slug: string;
  owner_email: string;
  plan: string;
  country_code?: string;
  seats_purchased?: number;
  trial_days?: number;
  features: Record<string, any>;
  notes?: string;
}) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_org_create', {
    p_name: input.name,
    p_slug: input.slug,
    p_owner_email: input.owner_email,
    p_plan: input.plan,
    p_country_code: input.country_code || null,
    p_seats_purchased: input.seats_purchased || 0,
    p_trial_days: input.trial_days || 14,
    p_features: input.features,
    p_notes: input.notes || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/empresas', 'page');
  return data as any;
}

export async function updateOrgFeaturesAction(orgId: string, features: Record<string, any>) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_org_features_set', {
    p_org_id: orgId,
    p_features: features,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/empresas', 'layout');
  return data as any;
}

export async function archiveOrgAction(orgId: string, reason?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_org_archive', {
    p_org_id: orgId,
    p_reason: reason || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/empresas', 'page');
  return data as any;
}

export async function extendTrialAction(orgId: string, days: number) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_org_extend_trial', {
    p_org_id: orgId,
    p_days: days,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/empresas', 'layout');
  return data as any;
}

export async function getOrgDetailsAction(orgId: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_org_details', { p_org_id: orgId });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function updateOrgBasicAction(orgId: string, updates: {
  name?: string;
  plan?: string;
  seats_purchased?: number;
  country_code?: string;
}) {
  const sb = await createClient();
  const { error } = await sb.from('nl_organizations').update({
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.plan !== undefined && { plan: updates.plan }),
    ...(updates.seats_purchased !== undefined && { seats_purchased: updates.seats_purchased }),
    ...(updates.country_code !== undefined && { country_code: updates.country_code }),
    updated_at: new Date().toISOString(),
  }).eq('id', orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/empresas', 'layout');
  return { ok: true };
}

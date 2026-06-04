'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ActionResult<T = unknown> { ok: boolean; error?: string; data?: T; }

interface AutopilotRow {
  key: string; enabled: boolean; description: string; category: string;
  job_type: string;
  cron_jobid: number | null; cron_schedule: string | null; cron_jobname: string | null; cron_active: boolean | null;
  last_run: string | null; last_run_status: string | null;
  total_runs_30d: number; failed_runs_7d: number;
  estimated_cost_eur_month: number;
  updated_at: string | null; updated_by: string | null;
}

export async function listAutopilotsAction(): Promise<ActionResult<AutopilotRow[]>> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_autopilots_list');
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data as AutopilotRow[]) || [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function toggleAutopilotAction(key: string, enabled: boolean): Promise<ActionResult> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_autopilots_set', { p_key: key, p_enabled: enabled });
    if (error) return { ok: false, error: `RPC: ${error.message}` };
    const result = data as { ok?: boolean; error?: string };
    if (!result?.ok) return { ok: false, error: result?.error || 'toggle_failed' };
    revalidatePath('/[locale]/admin/autopilots', 'page');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateScheduleAction(jobid: number, cron: string): Promise<ActionResult<{ schedule: string }>> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_autopilot_update_schedule', { p_jobid: jobid, p_schedule: cron });
    if (error) return { ok: false, error: `RPC: ${error.message}` };
    const result = data as { ok?: boolean; error?: string; detail?: string; schedule?: string };
    if (!result?.ok) return { ok: false, error: result?.detail || result?.error || 'update_failed' };
    revalidatePath('/[locale]/admin/autopilots', 'page');
    return { ok: true, data: { schedule: result.schedule! } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function hibernateAllAction(): Promise<ActionResult<{ disabled: number }>> {
  try {
    const sb = await createClient();
    const paidKeys = ['autopilot_blog_enabled','autopilot_blog_translate_enabled','autopilot_social_enabled','autopilot_scout_enabled','autopilot_seo_audit_enabled'];
    let disabled = 0;
    for (const key of paidKeys) {
      const { data } = await sb.rpc('nl_admin_autopilots_set', { p_key: key, p_enabled: false });
      const r = data as { ok?: boolean };
      if (r?.ok) disabled++;
    }
    revalidatePath('/[locale]/admin/autopilots', 'page');
    return { ok: true, data: { disabled } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

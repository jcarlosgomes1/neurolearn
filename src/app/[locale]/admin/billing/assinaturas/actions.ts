'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function listSubscriptionsAction() {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_subscriptions_list');
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data || [] };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function assignSubscriptionAction(params: {
  org_id: string; plan_id: string; billing_cycle: string; seats_purchased: number;
  status: string; trial_days?: number; period_days?: number;
}) {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_org_subscription_assign', {
      p_org_id: params.org_id, p_plan_id: params.plan_id,
      p_billing_cycle: params.billing_cycle, p_seats_purchased: params.seats_purchased,
      p_status: params.status, p_trial_days: params.trial_days,
      p_period_days: params.period_days || 30,
    });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'failed' };
    revalidatePath('/[locale]/admin/billing/assinaturas', 'page');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function syncStripeAction() {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, error: 'not_authenticated' };
    const { data: serviceKey } = await sb.from('nl_secrets').select('value').eq('key', 'SUPABASE_SERVICE_ROLE_KEY').maybeSingle();
    // Chamar via edge function (precisa service_role no header)
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obpezocujzdaznrdgwoo.supabase.co'}/functions/v1/stripe-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}` },
      body: JSON.stringify({ action: 'sync_all' }),
    });
    const data = await res.json();
    revalidatePath('/[locale]/admin/billing', 'layout');
    return data.ok ? { ok: true, data } : { ok: false, error: data.error || 'sync_failed', data };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ActionResult<T = unknown> { ok: boolean; error?: string; data?: T; }

// ===== PLANS =====
export async function listPlansAction() {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_billing_plans_list');
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data || [] };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function upsertPlanAction(plan: Record<string, unknown>): Promise<ActionResult> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_billing_plan_upsert', {
      p_id: plan.id, p_name: plan.name, p_description: plan.description, p_tagline: plan.tagline,
      p_badge: plan.badge, p_color: plan.color, p_currency: plan.currency || 'EUR',
      p_billing_model: plan.billing_model || 'subscription',
      p_flat_fee_monthly_cents: plan.flat_fee_monthly_cents, p_flat_fee_annual_cents: plan.flat_fee_annual_cents,
      p_price_per_seat_monthly_cents: plan.price_per_seat_monthly_cents,
      p_price_per_seat_annual_cents: plan.price_per_seat_annual_cents,
      p_min_seats: plan.min_seats, p_max_seats: plan.max_seats,
      p_trial_days: plan.trial_days ?? 0, p_annual_discount_pct: plan.annual_discount_pct,
      p_quotas: plan.quotas || {}, p_overage_pricing: plan.overage_pricing || {},
      p_features: plan.features || {},
      p_sort_order: plan.sort_order || 0,
      p_enabled: plan.enabled !== false, p_public_visible: plan.public_visible !== false,
    });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'failed' };
    revalidatePath('/[locale]/admin/billing', 'layout');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function deletePlanAction(id: string): Promise<ActionResult> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_billing_plan_delete', { p_id: id });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'failed' };
    revalidatePath('/[locale]/admin/billing', 'layout');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// ===== ADDONS =====
export async function listAddonsAction() {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_billing_addons_list');
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data || [] };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function upsertAddonAction(addon: Record<string, unknown>): Promise<ActionResult> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_billing_addon_upsert', {
      p_id: addon.id, p_name: addon.name, p_feature_key: addon.feature_key,
      p_description: addon.description, p_unit_type: addon.unit_type || 'flat',
      p_price_monthly_cents: addon.price_monthly_cents,
      p_price_annual_cents: addon.price_annual_cents,
      p_price_per_unit_cents: addon.price_per_unit_cents,
      p_currency: addon.currency || 'EUR',
      p_configuration: addon.configuration || {},
      p_sort_order: addon.sort_order || 0,
      p_enabled: addon.enabled !== false, p_public_visible: addon.public_visible !== false,
    });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'failed' };
    revalidatePath('/[locale]/admin/billing', 'layout');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function deleteAddonAction(id: string): Promise<ActionResult> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_billing_addon_delete', { p_id: id });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'failed' };
    revalidatePath('/[locale]/admin/billing', 'layout');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// ===== MARKETPLACE SETTINGS =====
export async function listMarketplaceSettingsAction() {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_marketplace_settings_list');
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data || [] };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function setMarketplaceSettingAction(key: string, value: unknown): Promise<ActionResult> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_marketplace_setting_set', { p_key: key, p_value: value });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error || 'failed' };
    revalidatePath('/[locale]/admin/billing/marketplace', 'page');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

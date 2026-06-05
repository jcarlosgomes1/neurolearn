'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function listMonetizationConfigsAction() {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_monetization_list');
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function bulkSetMonetizationAction(updates: Record<string, any>) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_monetization_bulk_set', { p_updates: updates });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/monetizacao');
  return data as any;
}

// Addons
export async function listAddonsAdminAction() {
  const sb = await createClient();
  const { data, error } = await sb.from('nl_pricing_addons').select('*').order('sort_order').order('name');
  if (error) return { ok: false, error: error.message };
  return { ok: true, addons: data };
}

export async function upsertAddonAction(id: string | null, formData: any) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_addon_upsert', { p_id: id, p_data: formData });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/addons');
  return data as any;
}

export async function deleteAddonAction(id: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_addon_delete', { p_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/addons');
  return data as any;
}

// Coupons
export async function listCouponsAction() {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_coupons_list');
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function upsertCouponAction(id: string | null, formData: any) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_coupon_upsert', { p_id: id, p_data: formData });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/cupoes');
  return data as any;
}

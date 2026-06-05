'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function revenueDashboardAction(window: string = '30d') {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_revenue_dashboard', { p_window: window });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function listUpsellSignalsAction(acted: boolean = false) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_upsell_signals_list', { p_acted: acted });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function actUpsellSignalAction(id: string, outcome: string, notes?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_upsell_signal_act', { p_id: id, p_outcome: outcome, p_notes: notes || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/upsells');
  return data as any;
}

export async function detectUpsellSignalsAction() {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_detect_b2c_to_b2b_signals');
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/upsells');
  return data as any;
}

export async function listInvoicesAction(status?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_invoices_list', { p_status: status || null, p_org_id: null, p_limit: 100 });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function createInvoiceAction(formData: any) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_invoice_create', { p_data: formData });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/invoices');
  return data as any;
}

export async function listRefundsAction(status?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_refunds_list', { p_status: status || null });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function resolveRefundAction(id: string, action: 'approve'|'reject', notes?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_refund_resolve', { p_id: id, p_action: action, p_notes: notes || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/refunds');
  return data as any;
}

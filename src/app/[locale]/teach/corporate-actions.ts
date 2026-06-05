'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function listOwnServicesAction() {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_instructor_services_list_own');
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function upsertServiceAction(id: string | null, data: Record<string, any>) {
  const sb = await createClient();
  const { data: r, error } = await sb.rpc('nl_instructor_service_upsert', {
    p_id: id, p_data: data,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/teach/servicos', 'page');
  return r as any;
}

export async function listInquiriesForInstructorAction(status?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_corporate_inquiries_for_instructor', {
    p_status: status || null,
  });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function quoteInquiryAction(inquiryId: string, priceCents: number, currency: string, notes?: string, validDays?: number) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_corporate_inquiry_quote', {
    p_inquiry_id: inquiryId,
    p_price_cents: priceCents,
    p_currency: currency,
    p_notes: notes || null,
    p_valid_days: validDays || 14,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/teach/pedidos', 'page');
  return data as any;
}

export async function completeInquiryAction(inquiryId: string, notes?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_corporate_inquiry_complete', {
    p_inquiry_id: inquiryId,
    p_notes: notes || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/teach/pedidos', 'page');
  return data as any;
}

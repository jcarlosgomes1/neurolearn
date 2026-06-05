'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function browseInstructorServicesAction(filters: {
  kind?: string;
  format?: string;
  language?: string;
  search?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
}) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_instructor_services_list_public', {
    p_kind: filters.kind || null,
    p_format: filters.format || null,
    p_language: filters.language || null,
    p_search: filters.search || null,
    p_min_price_cents: filters.minPriceCents || null,
    p_max_price_cents: filters.maxPriceCents || null,
    p_limit: 50,
    p_offset: 0,
  });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function createInquiryAction(orgId: string, instructorId: string, serviceId: string | null, data: Record<string, any>) {
  const sb = await createClient();
  const { data: r, error } = await sb.rpc('nl_corporate_inquiry_create', {
    p_org_id: orgId,
    p_instructor_id: instructorId,
    p_service_id: serviceId,
    p_data: data,
  });
  if (error) return { ok: false, error: error.message };
  return r as any;
}

export async function listInquiriesForOrgAction(orgId: string, status?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_corporate_inquiries_for_org', {
    p_org_id: orgId,
    p_status: status || null,
  });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function acceptInquiryAction(inquiryId: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_corporate_inquiry_accept', { p_inquiry_id: inquiryId });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/empresa', 'layout');
  return data as any;
}

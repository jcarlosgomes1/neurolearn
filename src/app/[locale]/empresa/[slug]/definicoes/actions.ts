'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateOrgAction(orgId: string, data: {
  name?: string; legal_name?: string; country_code?: string;
  vat_number?: string; logo_url?: string; primary_color?: string;
}) {
  const sb = await createClient();
  const { data: res, error } = await sb.rpc('nl_org_update', {
    p_org_id: orgId,
    p_name: data.name || null,
    p_legal_name: data.legal_name || null,
    p_country_code: data.country_code || null,
    p_vat_number: data.vat_number || null,
    p_logo_url: data.logo_url || null,
    p_primary_color: data.primary_color || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/empresa`);
  return (res as { ok?: boolean }) || { ok: true };
}

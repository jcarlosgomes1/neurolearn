'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

/**
 * Server action: grava ou apaga um secret. Tudo server-side, sem fetch do cliente,
 * sem necessidade de anon key, sem dependências do supabase-js no browser.
 */
export async function saveSecretAction(key: string, value: string): Promise<ActionResult<{ action: string; apply_strategy: string | null; auth_provider_key: string | null }>> {
  try {
    const sb = await createClient();
    const { data: { user }, error: userError } = await sb.auth.getUser();
    if (userError || !user) return { ok: false, error: 'Sessão expirada. Faz logout e login novamente.' };
    
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin','super_admin'].includes(profile.role)) {
      return { ok: false, error: 'Permissão negada (não és admin).' };
    }
    
    const { data, error } = await sb.rpc('nl_admin_integrations_set', { p_key: key, p_value: value });
    if (error) return { ok: false, error: `RPC: ${error.message}` };
    const result = data as { ok?: boolean; error?: string; action?: string; apply_strategy?: string; auth_provider?: string };
    if (!result?.ok) return { ok: false, error: result?.error || 'RPC retornou ok=false' };
    
    revalidatePath('/[locale]/admin/integracoes', 'page');
    
    return { 
      ok: true, 
      data: { 
        action: result.action || 'saved', 
        apply_strategy: result.apply_strategy || null,
        auth_provider_key: result.auth_provider || null,
      }
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

/**
 * Server action: push de provider OAuth ao Supabase Auth via Management API.
 * Chamada automaticamente após saveSecretAction quando key é OAuth.
 */
export async function pushOAuthProviderAction(provider: 'google' | 'github' | 'azure', field: 'client_id' | 'secret', value: string): Promise<ActionResult> {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, error: 'not_authenticated' };
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin','super_admin'].includes(profile.role)) {
      return { ok: false, error: 'forbidden' };
    }
    
    // Obter mgmt token
    const { data: tokenRow } = await sb.from('nl_secrets').select('value').eq('key', 'SUPABASE_MANAGEMENT_TOKEN').maybeSingle();
    if (!tokenRow?.value) {
      return { ok: false, error: 'SUPABASE_MANAGEMENT_TOKEN não configurado.' };
    }
    
    const body: Record<string, unknown> = {
      [`external_${provider}_enabled`]: true,
      [`external_${provider}_${field === 'secret' ? 'secret' : 'client_id'}`]: value,
    };
    
    const resp = await fetch(`https://api.supabase.com/v1/projects/obpezocujzdaznrdgwoo/config/auth`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRow.value}` },
      body: JSON.stringify(body),
    });
    
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, error: `Management API ${resp.status}: ${text.slice(0, 200)}` };
    }
    
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function refreshIntegrationsAction() {
  const sb = await createClient();
  const { data } = await sb.rpc('nl_admin_integrations_list');
  return data || [];
}

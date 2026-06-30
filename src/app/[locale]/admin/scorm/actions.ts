'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function runScormImportAction(
  packageId: string,
): Promise<{ ok: boolean; error?: string; kind?: string; launch_href?: string | null }> {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, error: 'Sessão expirada.' };
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes((profile as { role: string }).role)) {
      return { ok: false, error: 'Permissão negada.' };
    }
    if (!packageId?.trim()) return { ok: false, error: 'package_id em falta.' };

    const admin = createAdminClient();
    const { data, error } = await admin.functions.invoke('scorm-import', { body: { package_id: packageId.trim() } });
    if (error) return { ok: false, error: error.message || 'Falha na importação.' };
    const d = data as { ok?: boolean; error?: string; detail?: string; kind?: string; launch_href?: string | null };
    if (!d?.ok) return { ok: false, error: d?.detail || d?.error || 'Falha na importação.' };
    return { ok: true, kind: d.kind, launch_href: d.launch_href };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro inesperado.' };
  }
}

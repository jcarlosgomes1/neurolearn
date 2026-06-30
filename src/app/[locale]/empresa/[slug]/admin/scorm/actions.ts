'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getOrgContext(slug: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: org } = await sb.from('nl_organizations').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (!org) return null;
  const { data: m } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!m || !['owner', 'admin', 'editor'].includes((m as { role: string }).role)) return null;
  return { sb, org: org as { id: string; slug: string; name: string }, user };
}

export async function listOrgScormAction(slug: string) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false as const, error: 'forbidden' };
    const [{ data: pkgs }, { data: courses }] = await Promise.all([
      ctx.sb.rpc('nl_org_scorm_list', { p_org_id: ctx.org.id }),
      ctx.sb.rpc('nl_org_scorm_courses', { p_org_id: ctx.org.id }),
    ]);
    return {
      ok: true as const, orgId: ctx.org.id,
      packages: Array.isArray(pkgs) ? pkgs : [],
      courses: Array.isArray(courses) ? courses : [],
    };
  } catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; }
}

export async function createOrgScormAction(slug: string, courseId: string, title: string) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false as const, error: 'forbidden' };
    const { data } = await ctx.sb.rpc('nl_org_scorm_create', { p_org_id: ctx.org.id, p_course_id: courseId || '', p_title: title });
    const d = data as { ok?: boolean; id?: string; error?: string } | null;
    if (!d?.ok || !d.id) return { ok: false as const, error: d?.error || 'failed' };
    return { ok: true as const, id: d.id };
  } catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; }
}

export async function runOrgScormImportAction(slug: string, id: string) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false as const, error: 'forbidden' };
    const { data: pkgs } = await ctx.sb.rpc('nl_org_scorm_list', { p_org_id: ctx.org.id });
    const owns = Array.isArray(pkgs) && (pkgs as Array<{ id: string }>).some((p) => p.id === id);
    if (!owns) return { ok: false as const, error: 'not_found' };
    const admin = createAdminClient();
    const { data, error } = await admin.functions.invoke('scorm-import', { body: { package_id: id } });
    if (error) return { ok: false as const, error: error.message };
    const d = data as { ok?: boolean; error?: string; detail?: string } | null;
    if (!d?.ok) return { ok: false as const, error: d?.detail || d?.error || 'failed' };
    revalidatePath(`/[locale]/empresa/${slug}/admin/scorm`, 'page');
    return { ok: true as const };
  } catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; }
}

export async function deleteOrgScormAction(slug: string, id: string) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false as const, error: 'forbidden' };
    await ctx.sb.rpc('nl_org_scorm_delete', { p_org_id: ctx.org.id, p_id: id });
    return { ok: true as const };
  } catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

interface ContentRow {
  id: string;
  original_name: string;
  mime_type: string;
  file_size_bytes: number;
  extraction_status: string;
  extraction_error: string | null;
  summary: string | null;
  detected_topics: string[] | null;
  detected_skills: string[] | null;
  tags: string[] | null;
  uploader_id: string;
  created_at: string;
  extracted_at: string | null;
}

/**
 * Resolve org_id from slug + verify membership.
 */
async function getOrgForSlug(slug: string): Promise<{ org_id: string; user_id: string; role: string } | null> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  
  const { data: org } = await sb.from('nl_organizations').select('id').eq('slug', slug).maybeSingle();
  if (!org) return null;
  
  const { data: membership } = await sb.from('nl_org_members')
    .select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!membership) return null;
  
  return { org_id: org.id, user_id: user.id, role: membership.role };
}

export async function listOrgContentAction(slug: string): Promise<ActionResult<{ content: ContentRow[]; org_id: string; role: string }>> {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden_or_not_found' };
    
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_org_content_list', { p_org_id: ctx.org_id });
    if (error) return { ok: false, error: error.message };
    
    return { ok: true, data: { content: (data as ContentRow[]) || [], org_id: ctx.org_id, role: ctx.role } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Registers a content row after the file was uploaded directly to storage.
 * The trigger on nl_org_content auto-creates the agent job.
 */
export async function registerUploadAction(
  slug: string,
  storagePath: string,
  originalName: string,
  fileSizeBytes: number,
  mimeType: string,
  notes?: string,
  tags?: string[]
): Promise<ActionResult<{ content_id: string }>> {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden_or_not_found' };
    if (!['owner', 'admin', 'editor'].includes(ctx.role)) {
      return { ok: false, error: 'insufficient_role' };
    }
    
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_org_content_register_upload', {
      p_org_id: ctx.org_id,
      p_storage_path: storagePath,
      p_original_name: originalName,
      p_file_size_bytes: fileSizeBytes,
      p_mime_type: mimeType,
      p_notes: notes || null,
      p_tags: tags || null,
    });
    if (error) return { ok: false, error: `RPC: ${error.message}` };
    const result = data as { ok?: boolean; error?: string; content_id?: string };
    if (!result?.ok) return { ok: false, error: result?.error || 'register_failed' };
    
    revalidatePath(`/[locale]/empresa/${slug}/conteudos`, 'page');
    return { ok: true, data: { content_id: result.content_id! } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function retryIngestAction(slug: string, contentId: string): Promise<ActionResult> {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_org_content_retry_ingest', { p_content_id: contentId });
    if (error) return { ok: false, error: error.message };
    const result = data as { ok?: boolean; error?: string };
    if (!result?.ok) return { ok: false, error: result?.error || 'retry_failed' };
    
    revalidatePath(`/[locale]/empresa/${slug}/conteudos`, 'page');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function archiveContentAction(slug: string, contentId: string): Promise<ActionResult> {
  try {
    const ctx = await getOrgForSlug(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    if (!['owner', 'admin'].includes(ctx.role)) return { ok: false, error: 'insufficient_role' };
    
    const sb = await createClient();
    // Verify org_id matches before update (defense in depth)
    const { error } = await sb.from('nl_org_content')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', contentId)
      .eq('org_id', ctx.org_id);
    if (error) return { ok: false, error: error.message };
    
    revalidatePath(`/[locale]/empresa/${slug}/conteudos`, 'page');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

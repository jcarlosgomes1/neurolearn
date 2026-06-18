'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Material {
  id: string;
  original_name: string | null;
  public_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  use_as_source: boolean;
  label: string | null;
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CourseMaterials({ courseId }: { courseId: string }) {
  const t = useTranslations('course_materials');
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_course_materials_list', { p_course_id: courseId });
      setItems((data as Material[]) || []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { toast.error(t('too_large')); return; }
    setUploading(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { toast.error(t('auth_required')); setUploading(false); return; }
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${session.user.id}/${courseId}/${Date.now()}_${safe}`;
      const up = await sb.storage.from('course-materials').upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      const { data: pub } = sb.storage.from('course-materials').getPublicUrl(path);
      const { error } = await sb.rpc('nl_course_material_add', {
        p_course_id: courseId,
        p_storage_path: path,
        p_public_url: pub.publicUrl,
        p_original_name: file.name,
        p_mime_type: file.type,
        p_size_bytes: file.size,
        p_use_as_source: true,
        p_label: file.name,
      });
      if (error) throw error;
      toast.success(t('uploaded'));
      await load();
    } catch (err: any) {
      toast.error(err?.message || t('upload_failed'));
    } finally {
      setUploading(false);
    }
  }

  async function toggleSource(m: Material) {
    try {
      const sb = createClient();
      await sb.rpc('nl_course_material_toggle_source', { p_id: m.id, p_use: !m.use_as_source });
      setItems((arr) => arr.map((x) => (x.id === m.id ? { ...x, use_as_source: !x.use_as_source } : x)));
    } catch {
      toast.error(t('error'));
    }
  }

  async function remove(m: Material) {
    if (!confirm(t('confirm_delete'))) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_course_material_delete', { p_id: m.id });
      setItems((arr) => arr.filter((x) => x.id !== m.id));
      toast.success(t('deleted'));
    } catch {
      toast.error(t('error'));
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{t('title')}</h3>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl p-8 cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
        <span className="text-3xl">📎</span>
        <span className="text-sm font-medium text-slate-700">{uploading ? t('uploading') : t('drop_label')}</span>
        <span className="text-xs text-slate-400">{t('formats')}</span>
        <input type="file" className="hidden" onChange={onUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp,.zip" disabled={uploading} />
      </label>

      {loading ? (
        <p className="text-sm text-slate-400">{t('loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">{t('empty')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-xl shrink-0">📄</span>
              <div className="min-w-0 flex-1">
                <a href={m.public_url || '#'} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-slate-900 truncate hover:text-brand-700">{m.original_name || m.label || t('file')}</a>
                <span className="text-xs text-slate-400">{fmtSize(m.size_bytes)}</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0" title={t('source_hint')}>
                <input type="checkbox" checked={m.use_as_source} onChange={() => toggleSource(m)} className="h-4 w-4 rounded border-slate-300" />
                <span className="text-xs text-slate-600">{t('use_as_source')}</span>
              </label>
              <button onClick={() => remove(m)} className="text-slate-400 hover:text-red-600 shrink-0 p-1" aria-label={t('delete')}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

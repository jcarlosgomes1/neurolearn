'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Github, FileCode, ExternalLink, Download, Box, Loader2, Trash2, Paperclip, Link2 } from 'lucide-react';

interface Res {
  id: string;
  resource_type: string;
  url: string;
  label: string;
  description: string | null;
  sort_order: number;
  required: boolean;
}

const TYPES = ['external_link', 'github_repo', 'notebook_python', 'notebook_jupyter', 'sandbox_code'] as const;
const TYPE_ICON: Record<string, any> = {
  file_download: Download,
  external_link: ExternalLink,
  github_repo: Github,
  notebook_python: FileCode,
  notebook_jupyter: FileCode,
  sandbox_code: Box,
};

// Painel de autoria de materiais por aula (anexos para download + links). Escreve em nl_lesson_resources
// (mesma fonte que o aluno ve no visualizador). Disponivel para qualquer tipo de aula.
export function LessonResourcesEditor({ courseId, moduleIndex, lessonIndex }: { courseId: string; moduleIndex: number; lessonIndex: number }) {
  const t = useTranslations('lesson_res_editor');
  const [items, setItems] = useState<Res[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkType, setLinkType] = useState<string>('external_link');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_lesson_resources_list', { p_course_id: courseId, p_module_index: moduleIndex, p_lesson_index: lessonIndex });
      setItems(Array.isArray(data) ? (data as Res[]) : []);
    } catch { setItems([]); }
  }, [courseId, moduleIndex, lessonIndex]);

  useEffect(() => { load(); }, [load]);

  async function upsert(p: { resource_type: string; url: string; label: string; description?: string | null; required?: boolean; sort_order?: number; id?: string }) {
    const sb = createClient();
    const { error } = await sb.rpc('nl_lesson_resource_upsert', {
      p_course_id: courseId,
      p_module_index: moduleIndex,
      p_lesson_index: lessonIndex,
      p_resource_type: p.resource_type,
      p_url: p.url,
      p_label: p.label,
      p_description: p.description ?? null,
      p_sort_order: p.sort_order ?? (items?.length || 0),
      p_required: p.required ?? false,
      p_id: p.id ?? null,
    });
    if (error) throw error;
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
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
      const path = `${session.user.id}/${courseId}/lesson-${moduleIndex}-${lessonIndex}/${Date.now()}_${safe}`;
      const up = await sb.storage.from('course-materials').upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      const { data: pub } = sb.storage.from('course-materials').getPublicUrl(path);
      await upsert({ resource_type: 'file_download', url: pub.publicUrl, label: file.name });
      toast.success(t('added'));
      await load();
    } catch (err: any) {
      toast.error(err?.message || t('error'));
    } finally {
      setUploading(false);
    }
  }

  async function addLink() {
    if (!linkUrl.trim()) { toast.error(t('url_required')); return; }
    setBusy(true);
    try {
      await upsert({ resource_type: linkType, url: linkUrl.trim(), label: linkLabel.trim() || linkUrl.trim() });
      setLinkUrl('');
      setLinkLabel('');
      toast.success(t('added'));
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('error'));
    } finally {
      setBusy(false);
    }
  }

  async function toggleRequired(r: Res) {
    try {
      await upsert({ id: r.id, resource_type: r.resource_type, url: r.url, label: r.label, description: r.description, required: !r.required, sort_order: r.sort_order });
      setItems((arr) => (arr || []).map((x) => (x.id === r.id ? { ...x, required: !x.required } : x)));
    } catch { toast.error(t('error')); }
  }

  async function remove(r: Res) {
    if (!confirm(t('confirm_delete'))) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_lesson_resource_delete', { p_id: r.id });
      setItems((arr) => (arr || []).filter((x) => x.id !== r.id));
      toast.success(t('deleted'));
    } catch { toast.error(t('error')); }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2"><Paperclip className="h-4 w-4 text-slate-500" /> {t('title')}</h3>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      {items === null ? (
        <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" /> {t('loading')}</div>
      ) : items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((r) => {
            const Icon = TYPE_ICON[r.resource_type] || ExternalLink;
            return (
              <li key={r.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="h-9 w-9 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-slate-900 truncate hover:text-brand-700">{r.label}</a>
                  <span className="text-[11px] text-slate-400">{t(`type_${r.resource_type}` as any)}</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer shrink-0 text-xs text-slate-600" title={t('required_hint')}>
                  <input type="checkbox" checked={r.required} onChange={() => toggleRequired(r)} className="h-4 w-4 rounded border-slate-300" />
                  {t('required')}
                </label>
                <button onClick={() => remove(r)} className="text-slate-400 hover:text-rose-600 shrink-0 p-1" aria-label={t('delete')}><Trash2 className="h-4 w-4" /></button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">{t('empty')}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3 pt-1">
        <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl p-5 cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          <Download className="h-6 w-6 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{uploading ? t('uploading') : t('drop_label')}</span>
          <span className="text-[11px] text-slate-400">{t('formats')}</span>
          <input type="file" className="hidden" onChange={onUploadFile} accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.webp,.zip" disabled={uploading} />
        </label>

        <div className="border border-slate-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Link2 className="h-3.5 w-3.5" /> {t('by_link')}</div>
          <select value={linkType} onChange={(e) => setLinkType(e.target.value)} className="input text-sm">
            {TYPES.map((ty) => <option key={ty} value={ty}>{t(`type_${ty}` as any)}</option>)}
          </select>
          <input className="input text-sm" placeholder={t('link_url_ph')} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <input className="input text-sm" placeholder={t('link_label_ph')} value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
          <button onClick={addLink} disabled={busy} className="btn-primary w-full text-sm disabled:opacity-50">{busy ? t('adding') : t('add_link')}</button>
        </div>
      </div>
    </div>
  );
}

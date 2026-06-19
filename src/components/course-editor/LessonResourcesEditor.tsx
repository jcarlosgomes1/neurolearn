'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Github, FileCode, ExternalLink, Download, Box, Loader2, Trash2, Paperclip, Link2, Pencil, Check, X, ChevronUp, ChevronDown } from 'lucide-react';

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

// Painel completo de autoria de materiais por aula: upload de ficheiro + links, com descricao,
// edicao inline, reordenacao e obrigatorio. Escreve em nl_lesson_resources (mesma fonte do visualizador).
export function LessonResourcesEditor({ courseId, moduleIndex, lessonIndex }: { courseId: string; moduleIndex: number; lessonIndex: number }) {
  const t = useTranslations('lesson_res_editor');
  const [items, setItems] = useState<Res[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkType, setLinkType] = useState<string>('external_link');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_lesson_resources_list', { p_course_id: courseId, p_module_index: moduleIndex, p_lesson_index: lessonIndex });
      const arr = Array.isArray(data) ? (data as Res[]) : [];
      arr.sort((a, b) => (a.sort_order - b.sort_order) || a.id.localeCompare(b.id));
      setItems(arr);
    } catch { setItems([]); }
  }, [courseId, moduleIndex, lessonIndex]);

  useEffect(() => { load(); }, [load]);

  function nextOrder() {
    if (!items || items.length === 0) return 0;
    return Math.max(...items.map((x) => x.sort_order ?? 0)) + 1;
  }

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
      p_sort_order: p.sort_order ?? 0,
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
      await upsert({ resource_type: 'file_download', url: pub.publicUrl, label: file.name, sort_order: nextOrder() });
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
      await upsert({ resource_type: linkType, url: linkUrl.trim(), label: linkLabel.trim() || linkUrl.trim(), description: linkDesc.trim() || null, sort_order: nextOrder() });
      setLinkUrl('');
      setLinkLabel('');
      setLinkDesc('');
      toast.success(t('added'));
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('error'));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(r: Res) { setEditingId(r.id); setEditLabel(r.label); setEditDesc(r.description || ''); }
  function cancelEdit() { setEditingId(null); setEditLabel(''); setEditDesc(''); }

  async function saveEdit(r: Res) {
    setBusy(true);
    try {
      await upsert({ id: r.id, resource_type: r.resource_type, url: r.url, label: editLabel.trim() || r.url, description: editDesc.trim() || null, required: r.required, sort_order: r.sort_order });
      cancelEdit();
      await load();
    } catch (e: any) { toast.error(e?.message || t('error')); } finally { setBusy(false); }
  }

  async function toggleRequired(r: Res) {
    try {
      await upsert({ id: r.id, resource_type: r.resource_type, url: r.url, label: r.label, description: r.description, required: !r.required, sort_order: r.sort_order });
      setItems((arr) => (arr || []).map((x) => (x.id === r.id ? { ...x, required: !x.required } : x)));
    } catch { toast.error(t('error')); }
  }

  async function move(idx: number, dir: -1 | 1) {
    if (!items) return;
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const arr = [...items];
    const tmp = arr[idx]; arr[idx] = arr[j]; arr[j] = tmp;
    setItems(arr);
    setBusy(true);
    try {
      for (let k = 0; k < arr.length; k++) {
        const r = arr[k];
        if (r.sort_order !== k) {
          await upsert({ id: r.id, resource_type: r.resource_type, url: r.url, label: r.label, description: r.description, required: r.required, sort_order: k });
        }
      }
      await load();
    } catch (e: any) { toast.error(e?.message || t('error')); await load(); } finally { setBusy(false); }
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
          {items.map((r, idx) => {
            const Icon = TYPE_ICON[r.resource_type] || ExternalLink;
            const editing = editingId === r.id;
            return (
              <li key={r.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                {editing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Icon className="h-4 w-4" /> {t(`type_${r.resource_type}` as any)}</div>
                    <input className="input text-sm" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder={t('link_label_ph')} />
                    <textarea className="input text-sm min-h-[56px]" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder={t('description_ph')} />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(r)} disabled={busy} className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1 disabled:opacity-50"><Check className="h-3.5 w-3.5" />{t('save')}</button>
                      <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 inline-flex items-center gap-1"><X className="h-3.5 w-3.5" />{t('cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-slate-900 truncate hover:text-brand-700">{r.label}</a>
                      {r.description ? <p className="text-[11px] text-slate-500 line-clamp-1">{r.description}</p> : <span className="text-[11px] text-slate-400">{t(`type_${r.resource_type}` as any)}</span>}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => move(idx, -1)} disabled={idx === 0 || busy} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-500" aria-label={t('move_up')}><ChevronUp className="h-4 w-4" /></button>
                      <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1 || busy} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-500" aria-label={t('move_down')}><ChevronDown className="h-4 w-4" /></button>
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-600 px-1" title={t('required_hint')}>
                        <input type="checkbox" checked={r.required} onChange={() => toggleRequired(r)} className="h-3.5 w-3.5 rounded border-slate-300" />{t('required')}
                      </label>
                      <button onClick={() => startEdit(r)} className="p-1 rounded hover:bg-slate-200 text-slate-500" aria-label={t('edit')}><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(r)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600" aria-label={t('delete')}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )}
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
          <input className="input text-sm" placeholder={t('description_ph')} value={linkDesc} onChange={(e) => setLinkDesc(e.target.value)} />
          <button onClick={addLink} disabled={busy} className="btn-primary w-full text-sm disabled:opacity-50">{busy ? t('adding') : t('add_link')}</button>
        </div>
      </div>
    </div>
  );
}

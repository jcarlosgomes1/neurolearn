'use client';

import { useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, RefreshCw, Loader2, CheckCircle, Clock, XCircle, AlertCircle, ExternalLink, Tag, Sparkles, Filter } from 'lucide-react';

interface ContentItem {
  id: string;
  original_name: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  extraction_status: string;
  extraction_error: string | null;
  summary: string | null;
  detected_topics: string[] | null;
  detected_skills: string[] | null;
  tags: string[] | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  uploader_id: string;
}

const STATUS_META: Record<string, { labelKey: string; icon: any; cls: string }> = {
  pending:    { labelKey: 'org.cnt.status_pending',    icon: Clock,        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { labelKey: 'org.cnt.status_processing', icon: Loader2,      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:  { labelKey: 'org.cnt.status_completed',  icon: CheckCircle,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed:     { labelKey: 'org.cnt.status_failed',     icon: XCircle,      cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContentClient({ orgId, orgSlug, userId, items }: {
  orgId: string; orgSlug: string; userId: string; items: ContentItem[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = items.filter((i) => !i.archived).filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return i.extraction_status === 'completed';
    if (filter === 'pending') return ['pending', 'processing'].includes(i.extraction_status);
    if (filter === 'failed') return i.extraction_status === 'failed';
    return true;
  });

  const counts = {
    all: items.filter((i) => !i.archived).length,
    completed: items.filter((i) => !i.archived && i.extraction_status === 'completed').length,
    pending: items.filter((i) => !i.archived && ['pending','processing'].includes(i.extraction_status)).length,
    failed: items.filter((i) => !i.archived && i.extraction_status === 'failed').length,
  };

  async function uploadFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error(t('org.cnt.too_large', { size: formatBytes(MAX_BYTES) }));
      return;
    }
    setBusy(true);
    try {
      const sb = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${orgId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await sb.storage.from('org-content').upload(path, file, {
        cacheControl: '3600', upsert: false, contentType: file.type || 'application/octet-stream',
      });
      if (upErr) throw upErr;
      const { error: rpcErr } = await sb.rpc('nl_org_content_register_upload', {
        p_org_id: orgId,
        p_storage_path: path,
        p_original_name: file.name,
        p_file_size_bytes: file.size,
        p_mime_type: file.type || 'application/octet-stream',
      });
      if (rpcErr) throw rpcErr;
      toast.success(t('org.cnt.uploaded'));
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || t('org.cnt.upload_error'));
    } finally { setBusy(false); }
  }

  async function retry(id: string) {
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_org_content_retry_ingest', { p_content_id: id });
      if (error) throw error;
      toast.success(t('org.cnt.retried'));
      router.refresh();
    } catch (e: any) { toast.error(e?.message || t('tea.error')); }
  }

  async function archive(id: string) {
    if (!confirm(t('org.cnt.archive_confirm'))) return;
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_org_content_archive', { p_content_id: id });
      if (error) throw error;
      toast.success(t('org.cnt.archived'));
      const next = new Set(selected); next.delete(id); setSelected(next);
      router.refresh();
    } catch (e: any) { toast.error(e?.message || t('tea.error')); }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function createProposal() {
    if (selected.size === 0) { toast.error(t('org.cnt.select_min')); return; }
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_org_proposal_create', {
        p_org_id: orgId,
        p_content_ids: Array.from(selected),
        p_target_audience: null,
        p_difficulty: 'beginner',
        p_source_lang: 'pt',
      });
      if (error) throw error;
      toast.success(t('org.cnt.proposal_created'));
      setSelected(new Set());
      router.push({ pathname: '/empresa/[slug]/propostas', params: { slug: orgSlug } } as any);
    } catch (e: any) { toast.error(e?.message || t('tea.error')); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center">
        <Upload className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
        <h2 className="font-bold text-slate-900">{t('org.cnt.upload_h')}</h2>
        <p className="text-xs text-slate-600 mt-1">{t('org.cnt.upload_p')}</p>
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          className="inline-flex items-center gap-1.5 mt-4 px-5 py-2 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {t('org.cnt.choose_file')}
        </button>
        <input ref={inputRef} type="file" className="hidden"
          accept=".pdf,.doc,.docx,.md,.txt,.mp4,.mov,.webm,.mp3,.wav,.m4a"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }} />
      </div>

      {/* Filter tabs + Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {(['all','completed','pending','failed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded transition-colors ${filter === f ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              {f === 'all' ? t('org.cnt.filter_all') : f === 'completed' ? t('org.cnt.filter_completed') : f === 'pending' ? t('org.cnt.status_processing') : t('org.cnt.status_failed')}
              <span className="ml-1 text-[10px] opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold text-violet-700">{t('org.cnt.selected_count', { count: selected.size })}</span>
            <button onClick={createProposal} disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold rounded shadow-sm disabled:opacity-50">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} {t('org.cnt.gen_proposal')}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-violet-600 hover:text-violet-900 text-xs">{t('org.cnt.clear')}</button>
          </div>
        )}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            {filter === 'all' ? t('org.cnt.empty_all') : t('org.cnt.empty_filtered')}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((it) => {
            const meta = STATUS_META[it.extraction_status] || STATUS_META.pending;
            const Icon = meta.icon;
            const isSelected = selected.has(it.id);
            const canSelect = it.extraction_status === 'completed';
            return (
              <div key={it.id} className={`bg-white rounded-2xl border-2 p-4 transition-all ${isSelected ? 'border-violet-400 bg-violet-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start gap-3">
                  {canSelect && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(it.id)}
                      className="h-4 w-4 rounded text-violet-600 mt-1 flex-shrink-0 cursor-pointer" />
                  )}
                  {!canSelect && <div className="h-4 w-4 flex-shrink-0" />}
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-slate-900 truncate">{it.original_name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatBytes(it.file_size_bytes || 0)} · {new Date(it.created_at).toLocaleDateString(locale)}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${meta.cls}`}>
                        <Icon className={`h-3 w-3 ${it.extraction_status === 'processing' ? 'animate-spin' : ''}`} /> {t(meta.labelKey)}
                      </span>
                    </div>
                    {it.summary && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{it.summary}</p>
                    )}
                    {it.detected_topics && it.detected_topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {it.detected_topics.slice(0, 6).map((topic, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                            <Tag className="h-2.5 w-2.5 inline mr-0.5" />{topic}
                          </span>
                        ))}
                      </div>
                    )}
                    {it.extraction_status === 'failed' && it.extraction_error && (
                      <div className="bg-rose-50 border border-rose-200 rounded p-2 mt-2 flex items-start gap-1.5 text-[11px] text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{it.extraction_error}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      {it.extraction_status === 'failed' && (
                        <button onClick={() => retry(it.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded">
                          <RefreshCw className="h-3 w-3" /> {t('org.cnt.retry_btn')}
                        </button>
                      )}
                      <button onClick={() => archive(it.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded">
                        <Trash2 className="h-3 w-3" /> {t('org.cnt.archive_btn')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

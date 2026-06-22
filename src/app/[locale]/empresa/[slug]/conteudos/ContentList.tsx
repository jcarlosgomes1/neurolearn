'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { 
  Upload, FileText, CheckCircle2, XCircle, Loader2, Clock, 
  RefreshCw, Trash2, ChevronDown, ChevronUp, AlertCircle, Sparkles, X
} from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { registerUploadAction, retryIngestAction, archiveContentAction, listOrgContentAction } from './actions';
import { proposeCourseAction } from '../cursos/propostas/actions';

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

const ACCEPTED_MIME = ['application/pdf', 'text/plain', 'text/markdown'];
const MAX_SIZE = 100 * 1024 * 1024;

function formatBytes(n: number): string { if (n < 1024) return `${n} B`; if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`; return `${(n / (1024 * 1024)).toFixed(1)} MB`; }
function formatDate(iso: string, locale: string): string { return new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }); }

export function ContentList({ slug, orgId, role, initial }: { slug: string; orgId: string; role: string; initial: ContentRow[] }) {
  const t = useTranslations();
  const [items, setItems] = useState<ContentRow[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; pct: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [audience, setAudience] = useState<'beginner'|'intermediate'|'advanced'|'executive'>('intermediate');
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [isProposing, startProposing] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const canUpload = ['owner', 'admin', 'editor'].includes(role);
  const canArchive = ['owner', 'admin'].includes(role);
  const canPropose = ['owner', 'admin', 'editor'].includes(role);
  const readyItems = items.filter(i => i.extraction_status === 'ready');

  const refresh = useCallback(async () => {
    const result = await listOrgContentAction(slug);
    if (result.ok && result.data) setItems(result.data.content);
  }, [slug]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  
  function clearSelection() { setSelected(new Set()); }
  
  function handlePropose() {
    if (selected.size === 0) { toast.error(t('org.cl.select_min')); return; }
    if (selected.size > 20) { toast.error(t('org.cl.max20')); return; }
    startProposing(async () => {
      const r = await proposeCourseAction(slug, Array.from(selected), audience, difficulty, 'pt');
      if (r.ok && r.data) {
        toast.success(t('org.cl.proposal_created'));
        clearSelection();
        router.push(`/empresa/${slug}/cursos/propostas/${r.data.proposal_id}` as any);
      } else {
        toast.error(r.error || t('tea.error'));
      }
    });
  }

  async function handleFiles(files: FileList | File[]) {
    if (!canUpload) { toast.error(t('org.cl.no_perm')); return; }
    const validFiles = Array.from(files).filter((f) => {
      if (!ACCEPTED_MIME.includes(f.type)) { toast.error(t('org.cl.unsupported', { name: f.name })); return false; }
      if (f.size > MAX_SIZE) { toast.error(t('org.cl.too_big', { name: f.name })); return false; }
      return true;
    });
    if (validFiles.length === 0) return;
    setUploading(true);
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    for (const file of validFiles) {
      setUploadProgress({ name: file.name, pct: 0 });
      try {
        const ext = file.name.split('.').pop() || 'bin';
        const uuid = crypto.randomUUID();
        const path = `${orgId}/${uuid}.${ext}`;
        const { error: uploadErr } = await sb.storage.from('org-content').upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
        if (uploadErr) { toast.error(t('org.cl.upload_failed', { name: file.name, error: uploadErr.message })); continue; }
        setUploadProgress({ name: file.name, pct: 90 });
        const result = await registerUploadAction(slug, path, file.name, file.size, file.type);
        if (!result.ok) {
          toast.error(t('org.cl.register_failed', { error: result.error ?? '' }));
          await sb.storage.from('org-content').remove([path]);
          continue;
        }
        toast.success(t('org.cl.uploaded', { name: file.name }));
      } catch (e) { toast.error(t('org.cl.error_generic', { error: e instanceof Error ? e.message : String(e) })); }
    }
    setUploadProgress(null);
    setUploading(false);
    await refresh();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragOver(false);
    if (!canUpload) return;
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      <AppPageHeader title={t('org.cl.title')} description={<>{t('org.cl.subtitle')}{readyItems.length > 0 && <>{t('org.cl.subtitle_extra')}</>}</>} actions={
        <button type="button" onClick={refresh} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm">
          <RefreshCw className="h-3.5 w-3.5" /> {t('org.cl.refresh')}
        </button>
      } />

      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)} disabled={uploading} />
          {uploading && uploadProgress ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 mx-auto text-brand-600 animate-spin" />
              <div className="text-sm font-medium text-slate-700">{t('org.cl.uploading', { name: uploadProgress.name })}</div>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <div className="text-sm font-semibold text-slate-700">{t('org.cl.drop_hint')}</div>
              <div className="text-xs text-slate-500 mt-1">{t('org.cl.drop_formats')}</div>
            </>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {t('org.cl.empty')} {canUpload ? t('org.cl.empty_upload') : ''}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ContentCard 
              key={item.id} 
              item={item} 
              slug={slug}
              canArchive={canArchive}
              canSelect={canPropose && item.extraction_status === 'ready'}
              isSelected={selected.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onUpdate={refresh}
            />
          ))}
        </div>
      )}
      
      {/* Sticky propose bar */}
      {canPropose && selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 p-3 sm:p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Sparkles className="h-4 w-4 text-brand-600 flex-shrink-0" />
              <span className="font-semibold text-slate-900 text-sm">
                {t('org.cl.selected_count', { count: selected.size })}
              </span>
              <button onClick={clearSelection} className="ml-auto text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select value={audience} onChange={(e) => setAudience(e.target.value as any)}
                className="text-sm px-2 py-1.5 rounded-md border border-slate-200 focus:border-brand-400 outline-none bg-white">
                <option value="beginner">{t('org.cl.aud_beginner')}</option>
                <option value="intermediate">{t('org.cl.aud_intermediate')}</option>
                <option value="advanced">{t('org.cl.aud_advanced')}</option>
                <option value="executive">{t('org.cl.aud_executive')}</option>
              </select>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}
                className="text-sm px-2 py-1.5 rounded-md border border-slate-200 focus:border-brand-400 outline-none bg-white">
                <option value="easy">{t('org.cl.diff_easy')}</option>
                <option value="medium">{t('org.cl.diff_medium')}</option>
                <option value="hard">{t('org.cl.diff_hard')}</option>
              </select>
            </div>
            <button type="button" onClick={handlePropose} disabled={isProposing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50">
              {isProposing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {t('org.cl.propose_btn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCard({ item, slug, canArchive, canSelect, isSelected, onToggleSelect, onUpdate }: {
  item: ContentRow; slug: string; canArchive: boolean; canSelect: boolean;
  isSelected: boolean; onToggleSelect: () => void; onUpdate: () => Promise<void>;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  function handleRetry() {
    startTransition(async () => {
      const result = await retryIngestAction(slug, item.id);
      if (result.ok) { toast.success(t('org.cl.retry_started')); await onUpdate(); }
      else toast.error(result.error || t('tea.error'));
    });
  }
  
  function handleArchive() {
    if (!confirm(t('org.cl.archive_confirm', { name: item.original_name }))) return;
    startTransition(async () => {
      const result = await archiveContentAction(slug, item.id);
      if (result.ok) { toast.success(t('org.cl.archived')); await onUpdate(); }
      else toast.error(result.error || t('tea.error'));
    });
  }
  
  const hasDetails = item.summary || (item.detected_topics && item.detected_topics.length > 0) || (item.detected_skills && item.detected_skills.length > 0);

  return (
    <div className={`bg-white rounded-xl border ${isSelected ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'} overflow-hidden transition-colors`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1 flex items-start gap-3">
            {canSelect && (
              <input type="checkbox" checked={isSelected} onChange={onToggleSelect}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <h3 className="font-semibold text-slate-900 truncate">{item.original_name}</h3>
                <StatusBadge status={item.extraction_status} />
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                <span>{formatBytes(item.file_size_bytes)}</span>
                <span>·</span>
                <span>{formatDate(item.created_at, locale)}</span>
                {item.extracted_at && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> {t('org.cl.processed', { date: formatDate(item.extracted_at, locale) })}</span>
                  </>
                )}
              </div>
              {item.extraction_error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 break-words">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  <strong>{t('org.cl.error_label')}</strong> {item.extraction_error}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {item.extraction_status === 'failed' && (
              <button type="button" onClick={handleRetry} disabled={isPending} className="text-xs px-2 py-1.5 rounded-md hover:bg-blue-50 text-blue-700 disabled:opacity-50">
                <RefreshCw className={`h-3 w-3 ${isPending ? 'animate-spin' : ''}`} />
              </button>
            )}
            {hasDetails && (
              <button type="button" onClick={() => setExpanded(!expanded)} className="text-xs px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-700">
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            {canArchive && (
              <button type="button" onClick={handleArchive} disabled={isPending} className="text-xs px-2 py-1.5 rounded-md hover:bg-red-50 text-red-600 disabled:opacity-50">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {expanded && hasDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {item.summary && (
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{t('org.cl.summary')}</div>
                <p className="text-sm text-slate-700">{item.summary}</p>
              </div>
            )}
            {item.detected_topics && item.detected_topics.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">{t('org.cl.topics')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.detected_topics.map((topic, i) => (<span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{topic}</span>))}
                </div>
              </div>
            )}
            {item.detected_skills && item.detected_skills.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">{t('org.cl.skills')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.detected_skills.map((s, i) => (<span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{s}</span>))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  switch (status) {
    case 'pending': return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"><Clock className="h-2.5 w-2.5" /> {t('org.cnt.status_pending')}</span>;
    case 'processing': return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"><Loader2 className="h-2.5 w-2.5 animate-spin" /> {t('org.cnt.status_processing')}</span>;
    case 'ready': return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded"><CheckCircle2 className="h-2.5 w-2.5" /> {t('org.cnt.status_completed')}</span>;
    case 'failed': return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded"><XCircle className="h-2.5 w-2.5" /> {t('org.cnt.status_failed')}</span>;
    default: return <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{status}</span>;
  }
}

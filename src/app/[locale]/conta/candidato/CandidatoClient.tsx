'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Upload, Trash2, FileText, Award, Briefcase, FileSearch, ExternalLink, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';

type Kind = 'cv' | 'certificate' | 'portfolio' | 'sample' | 'other';

const KIND_META: Record<Kind, { labelKey: string; icon: any; accent: string }> = {
  cv: { labelKey: 'cand.kind_cv', icon: FileText, accent: 'from-violet-500 to-indigo-600' },
  certificate: { labelKey: 'cand.kind_certificate', icon: Award, accent: 'from-amber-500 to-orange-600' },
  portfolio: { labelKey: 'cand.kind_portfolio', icon: Briefcase, accent: 'from-emerald-500 to-teal-600' },
  sample: { labelKey: 'cand.kind_sample', icon: FileSearch, accent: 'from-blue-500 to-cyan-600' },
  other: { labelKey: 'cand.kind_other', icon: FileText, accent: 'from-slate-500 to-slate-600' },
};

const STATUS_META: Record<string, { labelKey: string; icon: any; color: string }> = {
  submitted: { labelKey: 'cand.st_submitted', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { labelKey: 'cand.st_under_review', icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  shortlisted: { labelKey: 'cand.st_shortlisted', icon: CheckCircle, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  screening_passed: { labelKey: 'cand.st_screening_passed', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  interview_scheduled: { labelKey: 'cand.st_interview_scheduled', icon: Clock, color: 'bg-violet-50 text-violet-700 border-violet-200' },
  approved: { labelKey: 'cand.st_approved', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  waitlisted: { labelKey: 'cand.st_waitlisted', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  rejected: { labelKey: 'cand.st_rejected', icon: XCircle, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  auto_rejected: { labelKey: 'cand.st_rejected', icon: XCircle, color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function CandidatoClient({ application, files, userId }: { application: any; files: any[]; userId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const grouped = groupFiles(files);
  const status = application?.status || null;
  const statusMeta = status ? STATUS_META[status] : null;

  async function uploadFile(file: File, kind: Kind) {
    if (file.size > 26214400) {
      toast.error(t('cand.file_too_big'));
      return;
    }
    setBusy(true);
    try {
      const sb = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${kind}/${Date.now()}_${safeName}`;
      const { error: upErr } = await sb.storage.from('instructor-applications').upload(path, file, {
        cacheControl: '3600', upsert: false, contentType: file.type || 'application/octet-stream',
      });
      if (upErr) throw upErr;
      const { error: rpcErr } = await sb.rpc('nl_instructor_file_register', {
        p_kind: kind, p_storage_path: path, p_original_name: file.name,
        p_mime_type: file.type, p_file_size_bytes: file.size, p_label: null,
      });
      if (rpcErr) throw rpcErr;
      toast.success(t('cand.file_saved'));
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || t('cand.upload_failed'));
    } finally {
      setBusy(false);
    }
  }

  async function deleteFile(f: any) {
    if (!confirm(t('cand.confirm_delete', { name: f.original_name }))) return;
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_instructor_file_delete', { p_id: f.id });
      if (data?.storage_path) {
        await sb.storage.from('instructor-applications').remove([data.storage_path]);
      }
      toast.success(t('cand.removed'));
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || t('cand.error'));
    }
  }

  async function openFile(f: any) {
    try {
      const sb = createClient();
      const { data, error } = await sb.storage.from('instructor-applications').createSignedUrl(f.storage_path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (e: any) {
      toast.error(t('cand.open_failed'));
    }
  }

  return (
    <div className="space-y-6">
      {/* Status candidatura */}
      {application && (
        <div className={`rounded-2xl border p-5 ${statusMeta?.color || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
          <div className="flex items-start gap-3">
            {statusMeta?.icon && <statusMeta.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
              <div className="font-semibold text-sm">{statusMeta ? t(statusMeta.labelKey) : status}</div>
              <p className="text-xs mt-1 leading-relaxed opacity-80">
                {t('cand.submitted_on', { date: new Date(application.applied_at).toLocaleDateString() })}
                {application.proposed_course_title && <>{t('cand.proposed_course_pre')}<span className="font-medium">{application.proposed_course_title}</span>.</>}
              </p>
            </div>
          </div>
        </div>
      )}
      {!application && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
          <p className="text-sm text-slate-600">
            {t('cand.no_application')}
          </p>
        </div>
      )}

      {/* Upload por categoria */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(['cv','certificate','portfolio','sample','other'] as Kind[]).map((kind) => (
          <KindBox
            key={kind}
            kind={kind}
            files={grouped[kind] || []}
            busy={busy}
            onUpload={(file) => uploadFile(file, kind)}
            onDelete={deleteFile}
            onOpen={openFile}
          />
        ))}
      </div>
    </div>
  );
}

function KindBox({ kind, files, busy, onUpload, onDelete, onOpen }: {
  kind: Kind; files: any[]; busy: boolean;
  onUpload: (f: File) => void; onDelete: (f: any) => void; onOpen: (f: any) => void;
}) {
  const t = useTranslations();
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pick() {
    inputRef.current?.click();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${meta.accent} text-white flex items-center justify-center shadow-sm`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-900">{t(meta.labelKey)}</div>
            <div className="text-[11px] text-slate-500">{t('cand.file_count', { count: files.length })}</div>
          </div>
        </div>
        <button
          onClick={pick}
          disabled={busy}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {t('cand.attach')}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = '';
          }}
        />
      </div>
      {files.length === 0 ? (
        <div className="p-5 text-center text-xs text-slate-400">
          {t('cand.upload_hint')}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {files.map((f) => (
            <div key={f.id} className="px-4 py-2.5 flex items-center gap-2 group hover:bg-slate-50/60">
              <div className="flex-1 min-w-0">
                <button onClick={() => onOpen(f)} className="text-left w-full">
                  <div className="text-xs font-medium text-slate-900 truncate group-hover:text-violet-700">{f.original_name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {f.file_size_bytes ? formatBytes(f.file_size_bytes) : ''}
                    {f.uploaded_at && <> · {new Date(f.uploaded_at).toLocaleDateString()}</>}
                  </div>
                </button>
              </div>
              <button onClick={() => onOpen(f)} className="p-1.5 text-slate-400 hover:text-violet-600 opacity-0 group-hover:opacity-100" title={t('cand.open')}>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(f)} className="p-1.5 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100" title={t('cand.delete')}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupFiles(files: any[]): Record<Kind, any[]> {
  const out: Record<Kind, any[]> = { cv: [], certificate: [], portfolio: [], sample: [], other: [] };
  for (const f of files || []) {
    const k = (f.kind || 'other') as Kind;
    if (out[k]) out[k].push(f); else out.other.push(f);
  }
  return out;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

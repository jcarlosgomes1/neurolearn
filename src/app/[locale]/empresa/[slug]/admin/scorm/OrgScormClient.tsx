'use client';

import { useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, UploadCloud, Package, Trash2, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { createOrgScormAction, runOrgScormImportAction, deleteOrgScormAction, listOrgScormAction } from './actions';

type Pkg = { id: string; course_id: string | null; title: string; kind: string | null; version: string | null; status: string; launch_href: string | null; error: string | null; created_at: string };
type Course = { id: string; title: string; emoji?: string };

const STATUS: Record<string, { cls: string; key: string }> = {
  uploaded: { cls: 'bg-slate-100 text-slate-600', key: 'scormadmin.st_uploaded' },
  extracting: { cls: 'bg-amber-100 text-amber-700', key: 'scormadmin.st_extracting' },
  ready: { cls: 'bg-emerald-100 text-emerald-700', key: 'scormadmin.st_ready' },
  error: { cls: 'bg-rose-100 text-rose-700', key: 'scormadmin.st_error' },
};

export function OrgScormClient({ slug, initialPackages, courses }: { slug: string; orgId: string; initialPackages: Pkg[]; courses: Course[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Pkg[]>(initialPackages || []);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ course_id: '', title: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const r = await listOrgScormAction(slug);
    if (r.ok) setRows((r.packages as Pkg[]) || []);
  }

  async function importPackage() {
    const file = fileRef.current?.files?.[0];
    if (!form.title.trim() || !file) { toast.error(t('scormadmin.required')); return; }
    setBusy(true);
    try {
      const created = await createOrgScormAction(slug, form.course_id.trim(), form.title.trim());
      if (!created.ok || !created.id) { toast.error(t('scormadmin.import_failed')); return; }
      const id = created.id;
      const up = await supabase.storage.from('scorm-content').upload(`${id}/source.zip`, file, { upsert: true, contentType: 'application/zip' });
      if (up.error) { toast.error(t('scormadmin.import_failed')); return; }
      const r = await runOrgScormImportAction(slug, id);
      if (!r.ok) { toast.error(r.error || t('scormadmin.import_failed')); await refresh(); return; }
      toast.success(t('scormadmin.imported'));
      setForm({ course_id: '', title: '' });
      if (fileRef.current) fileRef.current.value = '';
      await refresh();
    } finally { setBusy(false); }
  }

  async function del(id: string) {
    if (!confirm(t('scormadmin.delete_confirm'))) return;
    await deleteOrgScormAction(slug, id);
    toast.success(t('scormadmin.deleted'));
    await refresh();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-brand-600" />
        <h1 className="text-lg font-semibold text-slate-900">{t('scormlearn.title')}</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('scormadmin.title_label')}</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t('scormadmin.title_ph')}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('scormadmin.course_label')}</label>
            <select value={form.course_id} onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none">
              <option value="">{t('scormadmin.no_course')}</option>
              {courses.map((c) => (<option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.title}</option>))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('scormadmin.file_label')}</label>
          <input ref={fileRef} type="file" accept=".zip,application/zip"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100" />
          <p className="mt-2 text-xs text-slate-400">{t('scormadmin.hint')}</p>
        </div>
        <div className="mt-5">
          <button onClick={importPackage} disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-[1.02] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {busy ? t('scormadmin.uploading') : t('scormadmin.upload_btn')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Package className="h-4 w-4 text-brand-600" /> {t('scormadmin.list_title')}</h2>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('scormadmin.empty')}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((p) => {
              const st = STATUS[p.status] || STATUS.uploaded;
              return (
                <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-800">{p.title}</span>
                      {p.kind && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">{p.kind}{p.version ? ` · ${p.version}` : ''}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${st.cls}`}>
                        {p.status === 'ready' ? <CheckCircle2 className="h-3 w-3" /> : p.status === 'error' ? <AlertTriangle className="h-3 w-3" /> : null}
                        {t(st.key)}
                      </span>
                      {p.course_id && <span className="truncate">· {courses.find((c) => c.id === p.course_id)?.title || p.course_id}</span>}
                      {p.status === 'error' && p.error && <span className="truncate text-rose-500">· {p.error}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {p.status === 'ready' && (
                      <a href={`/${locale}/aprender/scorm/${p.id}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100">
                        <ExternalLink className="h-3.5 w-3.5" /> {t('scormadmin.open')}
                      </a>
                    )}
                    <button onClick={() => del(p.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

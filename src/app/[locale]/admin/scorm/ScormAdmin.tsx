'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, UploadCloud, Package, Trash2, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { runScormImportAction } from './actions';

type Pkg = {
  id: string; course_id: string | null; title: string; kind: string | null;
  version: string | null; status: string; launch_href: string | null; error: string | null; created_at: string;
};

const STATUS: Record<string, { cls: string; key: string }> = {
  uploaded: { cls: 'bg-slate-100 text-slate-600', key: 'scormadmin.st_uploaded' },
  extracting: { cls: 'bg-amber-100 text-amber-700', key: 'scormadmin.st_extracting' },
  ready: { cls: 'bg-emerald-100 text-emerald-700', key: 'scormadmin.st_ready' },
  error: { cls: 'bg-rose-100 text-rose-700', key: 'scormadmin.st_error' },
};

export function ScormAdmin() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ course_id: '', title: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.rpc('nl_scorm_list');
    setRows(Array.isArray(data) ? (data as Pkg[]) : []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function importPackage() {
    const file = fileRef.current?.files?.[0];
    if (!form.title.trim() || !file) { toast.error(t('scormadmin.required')); return; }
    setBusy(true);
    try {
      const { data: created, error: cErr } = await supabase.rpc('nl_scorm_create_package', {
        p_course_id: form.course_id.trim(), p_title: form.title.trim(),
      });
      const cd = created as { ok?: boolean; id?: string } | null;
      if (cErr || !cd?.ok || !cd.id) { toast.error(t('scormadmin.import_failed')); return; }
      const id = cd.id;
      const up = await supabase.storage.from('scorm-content').upload(`${id}/source.zip`, file, { upsert: true, contentType: 'application/zip' });
      if (up.error) { toast.error(t('scormadmin.import_failed')); return; }
      const r = await runScormImportAction(id);
      if (!r.ok) { toast.error(r.error || t('scormadmin.import_failed')); await load(); return; }
      toast.success(t('scormadmin.imported'));
      setForm({ course_id: '', title: '' });
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } finally { setBusy(false); }
  }

  async function del(id: string) {
    if (!confirm(t('scormadmin.delete_confirm'))) return;
    await supabase.rpc('nl_scorm_delete', { p_id: id });
    toast.success(t('scormadmin.deleted'));
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Formulário de importação */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('scormadmin.title_label')}</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t('scormadmin.title_ph')}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('scormadmin.course_label')}</label>
            <input
              value={form.course_id}
              onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
              placeholder={t('scormadmin.course_ph')}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('scormadmin.file_label')}</label>
          <input ref={fileRef} type="file" accept=".zip,application/zip"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" />
          <p className="mt-2 text-xs text-slate-400">{t('scormadmin.hint')}</p>
        </div>
        <div className="mt-5">
          <button
            onClick={importPackage}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-[1.02] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {busy ? t('scormadmin.uploading') : t('scormadmin.upload_btn')}
          </button>
        </div>
      </div>

      {/* Lista de pacotes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Package className="h-4 w-4 text-indigo-600" /> {t('scormadmin.list_title')}
        </h2>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> …</div>
        ) : rows.length === 0 ? (
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
                      {p.course_id && <span className="truncate">· {p.course_id}</span>}
                      {p.launch_href && <span className="inline-flex items-center gap-1 truncate text-slate-400"><ExternalLink className="h-3 w-3" />{p.launch_href}</span>}
                      {p.status === 'error' && p.error && <span className="truncate text-rose-500">· {p.error}</span>}
                    </div>
                  </div>
                  <button onClick={() => del(p.id)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

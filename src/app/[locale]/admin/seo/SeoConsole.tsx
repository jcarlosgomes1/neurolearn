'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Search } from 'lucide-react';

type Override = { id: string; page_type: string; page_id: string | null; lang: string; meta_title: string | null; meta_description: string | null; og_title: string | null; og_description: string | null; updated_at: string };

type Audit = { id: string; page_type: string; page_id: string | null; lang: string; score: number | null; issues: { rule: string; message: string; severity: string }[]; suggestions: { rule?: string; message?: string }[]; audited_at: string };

const LANGS = ['pt', 'en', 'es', 'fr'];

export function SeoConsole() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Override[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ page_type: 'marketing', page_id: '', lang: 'pt', meta_title: '', meta_description: '' });

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('nl_admin_seo_overview');
      const d = data as { ok?: boolean; overrides?: Override[]; audits?: Audit[] };
      if (d?.ok && Array.isArray(d.overrides)) setRows(d.overrides);
      if (d?.ok && Array.isArray(d.audits)) setAudits(d.audits);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save(o: Override) {
    setSavingId(o.id);
    try {
      const { data, error } = await supabase.rpc('nl_seo_apply_fix', {
        p_page_type: o.page_type, p_page_id: o.page_id, p_lang: o.lang,
        p_meta_title: o.meta_title, p_meta_description: o.meta_description,
        p_og_title: o.og_title, p_og_description: o.og_description,
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(t('seo.saved'));
    } catch { toast.error(t('seo.error')); }
    finally { setSavingId(null); }
  }

  async function create() {
    if (!draft.page_type.trim()) return;
    setSavingId('new');
    try {
      const { data, error } = await supabase.rpc('nl_seo_apply_fix', {
        p_page_type: draft.page_type, p_page_id: draft.page_id || null, p_lang: draft.lang,
        p_meta_title: draft.meta_title || null, p_meta_description: draft.meta_description || null,
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(t('seo.saved'));
      setCreating(false);
      setDraft({ page_type: 'marketing', page_id: '', lang: 'pt', meta_title: '', meta_description: '' });
      await load();
    } catch { toast.error(t('seo.error')); }
    finally { setSavingId(null); }
  }

  function patch(id: string, field: keyof Override, value: string) {
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  function fixFrom(a: Audit) {
    setDraft({ page_type: a.page_type, page_id: a.page_id || '', lang: a.lang, meta_title: '', meta_description: '' });
    setCreating(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {audits.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{t('seo.findings.title')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('seo.findings.sub')}</p>
          </div>
          <div className="space-y-2">
            {audits.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200/70 p-3 space-y-2">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{a.page_type}</span>
                  {a.page_id && <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{a.page_id}</span>}
                  <span className="font-bold text-violet-600 uppercase">{a.lang}</span>
                  {a.score != null && (
                    <span className={`ml-auto px-2 py-0.5 rounded-full font-semibold ${a.score < 70 ? 'bg-red-100 text-red-700' : a.score < 85 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {t('seo.findings.score')}: {a.score}
                    </span>
                  )}
                </div>
                {Array.isArray(a.issues) && a.issues.length > 0 && (
                  <ul className="space-y-1">
                    {a.issues.map((it, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${it.severity === 'high' ? 'bg-red-500' : it.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        <span>{it.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => fixFrom(a)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 text-xs font-medium hover:bg-violet-50">
                  <Save className="h-3.5 w-3.5" /> {t('seo.findings.fix')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!creating ? (
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">
          <Plus className="h-4 w-4" /> {t('seo.new')}
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input value={draft.page_type} onChange={(e) => setDraft((d) => ({ ...d, page_type: e.target.value }))} placeholder={t('seo.page_type')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={draft.page_id} onChange={(e) => setDraft((d) => ({ ...d, page_id: e.target.value }))} placeholder={t('seo.page_id')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select value={draft.lang} onChange={(e) => setDraft((d) => ({ ...d, lang: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
          <input value={draft.meta_title} onChange={(e) => setDraft((d) => ({ ...d, meta_title: e.target.value }))} placeholder={t('seo.meta_title')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <textarea value={draft.meta_description} onChange={(e) => setDraft((d) => ({ ...d, meta_description: e.target.value }))} placeholder={t('seo.meta_desc')} rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={create} disabled={savingId === 'new'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
              {savingId === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('seo.create')}
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">{t('seo.cancel')}</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-2">
          <Search className="h-8 w-8 text-slate-300" /> {t('seo.empty')}
        </div>
      ) : rows.map((o) => (
        <div key={o.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{o.page_type}</span>
            {o.page_id && <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{o.page_id}</span>}
            <span className="font-bold text-violet-600 uppercase">{o.lang}</span>
          </div>
          <input value={o.meta_title || ''} onChange={(e) => patch(o.id, 'meta_title', e.target.value)} placeholder={t('seo.meta_title')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <textarea value={o.meta_description || ''} onChange={(e) => patch(o.id, 'meta_description', e.target.value)} placeholder={t('seo.meta_desc')} rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
          <button onClick={() => save(o)} disabled={savingId === o.id}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
            {savingId === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {t('seo.save')}
          </button>
        </div>
      ))}
    </div>
  );
}

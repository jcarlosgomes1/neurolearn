'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Save, X, CheckCircle2 } from 'lucide-react';
import { DocumentView } from '@/components/primitives/DocumentView';

interface ClauseToggle { code: string; title: string; scope: string; is_base: boolean; default_on: boolean; enabled: boolean }
interface Custom { id: string; title: string | null; body_md: string; sort_order: number }
type Doc = { ok: boolean; hash: string; body_md: string; stats: { instructors: number; last_at: string | null } };

const LANGS = ['pt', 'en', 'es', 'fr'];

/** Painel de Termos por curso: documento montado (DocumentView) + toggles de cláusulas + cláusulas específicas. */
export function CourseTermsPanel({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const [clauses, setClauses] = useState<ClauseToggle[]>([]);
  const [custom, setCustom] = useState<Custom[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ id: string | null; title: string; body_md: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState('pt');
  const [doc, setDoc] = useState<Doc | null>(null);

  const loadTerms = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_course_terms_get', { p_course_id: courseId });
      if (error) throw error;
      const res = data as { ok: boolean; clauses?: ClauseToggle[]; custom?: Custom[] };
      setClauses(res?.clauses || []);
      setCustom(res?.custom || []);
    } catch { setClauses([]); setCustom([]); }
    finally { setLoading(false); }
  }, [courseId]);

  const loadDoc = useCallback(async () => {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_terms_document', { p_scope: 'course', p_course_id: courseId, p_lang: lang });
      if (error) throw error;
      setDoc(data as Doc);
    } catch { setDoc(null); }
  }, [courseId, lang]);

  useEffect(() => { loadTerms(); }, [loadTerms]);
  useEffect(() => { loadDoc(); }, [loadDoc]);

  async function toggle(code: string, enabled: boolean) {
    setClauses((prev) => prev.map((c) => c.code === code ? { ...c, enabled } : c));
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_course_terms_toggle', { p_course_id: courseId, p_clause_code: code, p_enabled: enabled });
      if (error) throw error;
      loadDoc();
    } catch { toast.error(t('course_ws.terms.update_error')); loadTerms(); }
  }

  async function saveCustom() {
    if (!draft || !draft.body_md.trim()) return;
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_course_terms_custom_save', { p_course_id: courseId, p_id: draft.id, p_title: draft.title.trim() || null, p_body_md: draft.body_md.trim() });
      if (error) throw error;
      toast.success(t('course_ws.terms.saved'));
      setDraft(null);
      await loadTerms(); await loadDoc();
    } catch { toast.error(t('course_ws.terms.save_error')); }
    finally { setSaving(false); }
  }

  async function removeCustom(id: string) {
    if (!confirm(t('course_ws.terms.delete_confirm'))) return;
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_course_terms_custom_delete', { p_id: id });
      if (error) throw error;
      toast.success(t('course_ws.terms.deleted'));
      await loadTerms(); await loadDoc();
    } catch { toast.error(t('course_ws.terms.update_error')); }
  }

  if (loading) return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const lastAt = doc?.stats?.last_at ? new Date(doc.stats.last_at).toLocaleDateString() : null;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-end mb-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {LANGS.map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`text-xs font-medium px-2.5 py-1.5 rounded-md uppercase ${lang === l ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{l}</button>
            ))}
          </div>
        </div>
        {doc && (doc.body_md || '').trim() ? (
          <DocumentView
            eyebrow={t('admin.terms_doc.eyebrow')}
            title={t('admin.terms_doc.doc_course')}
            signable
            signableLabel={t('admin.terms_doc.signable')}
            meta={[
              { label: t('admin.terms_doc.lang'), value: lang.toUpperCase() },
              { label: t('admin.terms_doc.version'), value: (doc.hash || '').slice(0, 8) },
            ]}
            bodyMd={doc.body_md}
            signatureBlock={
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {doc.stats && doc.stats.instructors > 0 ? (
                  <span className="text-slate-600"><span className="font-semibold text-slate-900">{doc.stats.instructors}</span> {t('admin.terms_doc.instructors_accepted')}{lastAt && <span className="text-slate-400"> · {t('admin.terms_doc.last')} {lastAt}</span>}</span>
                ) : (
                  <span className="text-slate-500">{t('admin.terms_doc.none_yet')}</span>
                )}
              </div>
            }
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-400 text-center">{t('admin.terms_doc.empty')}</div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-2">{t('course_ws.terms.clauses_title')}</h2>
        <p className="text-xs text-slate-400 mb-3">{t('course_ws.terms.clauses_base_note')}</p>
        {clauses.length === 0 ? (
          <p className="text-sm text-slate-400">{t('course_ws.terms.clauses_none')}</p>
        ) : (
          <ul className="space-y-2">
            {clauses.map((c) => (
              <li key={c.code} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-slate-800">{c.title}</span>
                  <span className="ml-2 text-[10px] font-mono uppercase rounded bg-slate-100 text-slate-500 px-1.5 py-0.5">{c.code}</span>
                  {c.default_on ? <span className="ml-1 text-[10px] rounded bg-emerald-50 text-emerald-600 px-1.5 py-0.5">{t('course_ws.terms.suggested')}</span> : null}
                </div>
                <button onClick={() => toggle(c.code, !c.enabled)} role="switch" aria-checked={c.enabled}
                  className={c.enabled ? 'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors bg-brand-600' : 'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors bg-slate-200'}>
                  <span className={c.enabled ? 'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform translate-x-5' : 'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform translate-x-0.5'} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800">{t('course_ws.terms.custom_title')}</h2>
          <button onClick={() => setDraft({ id: null, title: '', body_md: '' })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 px-2.5 py-1.5 hover:bg-slate-50"><Plus className="w-3.5 h-3.5 text-brand-500" />{t('course_ws.terms.add')}</button>
        </div>
        {draft && (
          <div className="mb-3 rounded-xl border border-brand-200 bg-brand-50/40 p-3 space-y-2">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t('course_ws.terms.title_opt')} className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <textarea value={draft.body_md} onChange={(e) => setDraft({ ...draft, body_md: e.target.value })} rows={4} placeholder={t('course_ws.terms.body_ph')} className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-200 resize-y" />
            <div className="flex items-center gap-2">
              <button onClick={saveCustom} disabled={saving || !draft.body_md.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium px-3.5 py-1.5 disabled:opacity-50 hover:bg-slate-800">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{t('course_ws.terms.save')}</button>
              <button onClick={() => setDraft(null)} className="inline-flex items-center gap-1 text-sm text-slate-500 px-2 py-1.5 hover:text-slate-700"><X className="w-4 h-4" />{t('course_ws.terms.cancel')}</button>
            </div>
          </div>
        )}
        {custom.length === 0 && !draft ? (
          <p className="text-sm text-slate-400">{t('course_ws.terms.custom_none')}</p>
        ) : (
          <ul className="space-y-2">
            {custom.map((c) => (
              <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {c.title ? <p className="text-sm font-semibold text-slate-900">{c.title}</p> : null}
                    <p className="text-xs text-slate-500 whitespace-pre-wrap line-clamp-3">{c.body_md}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <button onClick={() => setDraft({ id: c.id, title: c.title || '', body_md: c.body_md })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => removeCustom(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

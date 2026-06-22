'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DocumentView } from '@/components/primitives/DocumentView';
import { EmptyState } from '@/components/primitives/EmptyState';

type Doc = {
  ok: boolean; scope: string; lang: string; signable: boolean; hash: string;
  body_md: string;
  clauses: { code: string; title: string; scope: string; is_base: boolean }[];
  stats: { accepted_count: number; instructors: number; last_at: string | null };
};

const LANGS = ['pt', 'en', 'es', 'fr'];

export function TermsPreviewClient() {
  const t = useTranslations();
  const [scope, setScope] = useState<'application' | 'course'>('application');
  const [lang, setLang] = useState('pt');
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_terms_document', { p_scope: scope, p_course_id: null, p_lang: lang });
      if (error) throw error;
      setDoc(data as Doc);
    } catch { setDoc(null); }
    finally { setLoading(false); }
  }, [scope, lang]);

  useEffect(() => { load(); }, [load]);

  const stats = doc?.stats;
  const lastAt = stats?.last_at ? new Date(stats.last_at).toLocaleDateString() : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <a href=".." className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"><ArrowLeft className="w-4 h-4" />{t('admin.terms_doc.back')}</a>
      <AdminPageHeader emoji="📜" title={t('admin.terms_doc.title')} description={t('admin.terms_doc.subtitle')} />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(['application', 'course'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} className={`text-xs font-medium px-3 py-1.5 rounded-md ${scope === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              {s === 'application' ? t('admin.terms_doc.scope_application') : t('admin.terms_doc.scope_course')}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {LANGS.map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`text-xs font-medium px-2.5 py-1.5 rounded-md uppercase ${lang === l ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !doc || !doc.ok || !(doc.body_md || '').trim() ? (
          <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState emoji="📄" title={t('admin.terms_doc.empty')} /></div>
        ) : (
          <DocumentView
            eyebrow={t('admin.terms_doc.eyebrow')}
            title={scope === 'application' ? t('admin.terms_doc.doc_application') : t('admin.terms_doc.doc_course')}
            signable
            signableLabel={t('admin.terms_doc.signable')}
            meta={[
              { label: t('admin.terms_doc.scope'), value: scope === 'application' ? t('admin.terms_doc.scope_application') : t('admin.terms_doc.scope_course') },
              { label: t('admin.terms_doc.lang'), value: lang.toUpperCase() },
              { label: t('admin.terms_doc.version'), value: (doc.hash || '').slice(0, 8) },
            ]}
            bodyMd={doc.body_md}
            signatureBlock={
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {stats && stats.instructors > 0 ? (
                  <span className="text-slate-600">
                    <span className="font-semibold text-slate-900">{stats.instructors}</span> {t('admin.terms_doc.instructors_accepted')}
                    {lastAt && <span className="text-slate-400"> · {t('admin.terms_doc.last')} {lastAt}</span>}
                  </span>
                ) : (
                  <span className="text-slate-500">{t('admin.terms_doc.none_yet')}</span>
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

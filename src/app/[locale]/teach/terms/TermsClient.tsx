'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Clock, Sparkles, ChevronDown } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

interface CourseTerms { course_id: string; title: string; emoji?: string | null; approval_status?: string | null; accepted: boolean; source_lang?: string | null }
interface AppTerms { accepted: boolean; body_md: string; hash: string }
interface Overview { ok: boolean; application: AppTerms; courses: CourseTerms[] }

export function TermsClient() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [appOpen, setAppOpen] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [courseBodies, setCourseBodies] = useState<Record<string, string>>({});
  const [openCourse, setOpenCourse] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: d, error } = await sb.rpc('nl_instructor_terms_overview', { p_lang: locale });
      if (error) throw error;
      setData(d as Overview);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [locale]);

  useEffect(() => { load(); }, [load]);

  const courseLang = (id: string) => (data?.courses.find((c) => c.course_id === id)?.source_lang) || 'pt';

  async function acceptApplication() {
    setAccepting('application');
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data: r, error } = await sb.rpc('nl_instructor_terms_accept', { p_scope: 'application', p_course_id: null, p_lang: locale });
      if (error) throw error;
      if (!(r as { ok: boolean })?.ok) throw new Error('rpc');
      toast.success(t('teach.terms.accepted_toast'));
      await load();
    } catch { toast.error(t('teach.terms.error')); }
    finally { setAccepting(null); }
  }

  async function toggleCourse(courseId: string) {
    if (openCourse === courseId) { setOpenCourse(null); return; }
    setOpenCourse(courseId);
    if (!courseBodies[courseId]) {
      try {
        const sb = createClient();
        const { data: s } = await sb.rpc('nl_instructor_terms_status', { p_scope: 'course', p_course_id: courseId, p_lang: courseLang(courseId) });
        setCourseBodies((prev) => ({ ...prev, [courseId]: ((s as { body_md?: string })?.body_md) || '' }));
      } catch { /* ignore */ }
    }
  }

  async function acceptCourse(courseId: string) {
    setAccepting(courseId);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data: r, error } = await sb.rpc('nl_instructor_terms_accept', { p_scope: 'course', p_course_id: courseId, p_lang: courseLang(courseId) });
      if (error) throw error;
      if (!(r as { ok: boolean })?.ok) throw new Error('rpc');
      toast.success(t('teach.terms.accepted_toast'));
      await load();
    } catch { toast.error(t('teach.terms.error')); }
    finally { setAccepting(null); }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div></div>;

  const app = data?.application;
  const appBody = (app?.body_md || '').trim();
  const courses = data?.courses || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <AppPageHeader  title={t('teach.terms.title')} description={t('teach.terms.description')} />
      </div>

      <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-900 leading-relaxed">{t('teach.terms.motivational')}</p>
        </div>
      </div>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800">{t('teach.terms.application_title')}</h2>
          {app?.accepted
            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-1"><CheckCircle2 className="w-3 h-3" />{t('teach.terms.accepted')}</span>
            : <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium px-2.5 py-1"><Clock className="w-3 h-3" />{t('teach.terms.pending')}</span>}
        </div>
        {appBody.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{t('teach.terms.empty_terms')}</div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <button onClick={() => setAppOpen((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 mb-2">
              {appOpen ? t('teach.terms.hide') : t('teach.terms.view')}
              <ChevronDown className={appOpen ? 'w-4 h-4 rotate-180 transition-transform' : 'w-4 h-4 transition-transform'} />
            </button>
            {appOpen && <pre className="mt-1 mb-3 text-xs text-slate-700 whitespace-pre-wrap font-sans max-h-80 overflow-auto rounded-xl bg-slate-50 p-3">{appBody}</pre>}
            {!app?.accepted && (
              <button onClick={acceptApplication} disabled={accepting === 'application'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">
                {accepting === 'application' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {accepting === 'application' ? t('teach.terms.accepting') : t('teach.terms.accept')}
              </button>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">{t('teach.terms.course_title')}</h2>
        <p className="text-xs text-slate-400 mb-3">{t('teach.terms.required_note')}</p>
        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500 text-sm">{t('teach.terms.no_courses')}</div>
        ) : (
          <ul className="space-y-2">
            {courses.map((c) => {
              const body = (courseBodies[c.course_id] || '').trim();
              const open = openCourse === c.course_id;
              return (
                <li key={c.course_id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800 min-w-0 truncate">{(c.emoji ? c.emoji + ' ' : '') + c.title}</p>
                    {c.accepted
                      ? <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-1"><CheckCircle2 className="w-3 h-3" />{t('teach.terms.accepted')}</span>
                      : <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium px-2.5 py-1"><Clock className="w-3 h-3" />{t('teach.terms.pending')}</span>}
                  </div>
                  <button onClick={() => toggleCourse(c.course_id)} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                    {open ? t('teach.terms.hide') : t('teach.terms.view')}
                    <ChevronDown className={open ? 'w-4 h-4 rotate-180 transition-transform' : 'w-4 h-4 transition-transform'} />
                  </button>
                  {open && (
                    <div className="mt-2">
                      {body.length === 0 ? (
                        <p className="text-sm text-slate-400">{t('teach.terms.empty_terms')}</p>
                      ) : (
                        <>
                          <pre className="mb-3 text-xs text-slate-700 whitespace-pre-wrap font-sans max-h-80 overflow-auto rounded-xl bg-slate-50 p-3">{body}</pre>
                          {!c.accepted && (
                            <button onClick={() => acceptCourse(c.course_id)} disabled={accepting === c.course_id}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">
                              {accepting === c.course_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              {accepting === c.course_id ? t('teach.terms.accepting') : t('teach.terms.accept')}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

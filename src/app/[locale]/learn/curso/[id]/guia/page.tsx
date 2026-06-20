import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Target, Lightbulb, ListChecks, Library, HelpCircle, ChevronDown } from 'lucide-react';

export const metadata = { title: 'Guia de estudo' };

interface GuideLesson { title?: string; objective?: string; kp?: string[] | null; tip?: string | null }
interface GuideModule { title?: string; lessons?: GuideLesson[] }
interface Term { id: string; term: string; definition: string }
interface Faq { id: string; question: string; answer: string }

export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations('guide');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect_to=/learn/curso/${id}/guia`);

  const { data, error } = await sb.rpc('nl_course_study_guide', { p_course_id: id });
  const r = data as { ok?: boolean; error?: string; title?: string; subtitle?: string | null; modules?: GuideModule[] } | null;
  if (error || !r?.ok) {
    redirect(r?.error === 'no_access' ? `/${locale}/curso/${id}` : `/${locale}/learn`);
  }
  const modules: GuideModule[] = Array.isArray(r?.modules) ? r!.modules! : [];

  const { data: fData } = await sb.rpc('nl_faq_for_course', { p_course_id: id });
  const fr = fData as { ok?: boolean; faq?: Faq[] } | null;
  const faq: Faq[] = fr?.ok && Array.isArray(fr.faq) ? fr.faq : [];

  const { data: gData } = await sb.rpc('nl_glossary_for_course', { p_course_id: id });
  const gr = gData as { ok?: boolean; terms?: Term[] } | null;
  const terms: Term[] = gr?.ok && Array.isArray(gr.terms) ? gr.terms : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href={`/learn/curso/${id}/aula/0/0` as any} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> {t('back')}
      </Link>

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{t('eyebrow')}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1 text-balance">{r?.title}</h1>
        <p className="text-slate-500 mt-2">{t('subtitle')}</p>
      </header>

      <div className="space-y-10">
        {modules.map((mod, mi) => (
          <section key={mi}>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{mod.title}</h2>
            <div className="space-y-6">
              {(mod.lessons || []).map((les, li) => (
                <article key={li} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-semibold text-slate-900">{les.title}</h3>
                  {les.objective && (
                    <p className="flex items-start gap-2 text-sm text-slate-600 mt-2">
                      <Target className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                      <span><span className="font-medium text-slate-700">{t('objective')}:</span> {les.objective}</span>
                    </p>
                  )}
                  {Array.isArray(les.kp) && les.kp.length > 0 && (
                    <div className="mt-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5"><ListChecks className="h-3.5 w-3.5" /> {t('key_points')}</p>
                      <ul className="space-y-1.5">
                        {les.kp!.map((k, ki) => (
                          <li key={ki} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
                            <span>{k}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {les.tip && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-800"><span className="font-medium">{t('tip')}:</span> {les.tip}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}

        {faq.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-brand-500" /> {t('faq')}
            </h2>
            <div className="space-y-2">
              {faq.map((q) => (
                <details key={q.id} className="group rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <summary className="cursor-pointer list-none font-medium text-slate-900 flex items-start justify-between gap-3">
                    <span>{q.question}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{q.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {terms.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <Library className="h-5 w-5 text-brand-500" /> {t('glossary')}
            </h2>
            <dl className="space-y-3">
              {terms.map((g) => (
                <div key={g.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <dt className="font-semibold text-slate-900">{g.term}</dt>
                  <dd className="text-sm text-slate-600 mt-0.5">{g.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}

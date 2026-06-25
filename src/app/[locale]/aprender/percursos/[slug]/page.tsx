import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Clock, Users, BookOpen, ChevronLeft, CheckCircle2, Sparkles, Target, Trophy, Lightbulb, ArrowRight } from 'lucide-react';
import { EnrollPathButton } from './EnrollPathButton';

export const revalidate = 300;

const DIFF_KEY: Record<string, string> = {
  beginner: 'path.diff_beginner',
  intermediate: 'path.diff_intermediate',
  advanced: 'path.diff_advanced',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_learning_path_get_by_slug', { p_slug: slug });
  const path = (data as any)?.path;
  if (!path) return { title: 'Percurso' };
  const n = path.narrative || {};
  return { title: path.title, description: n.tagline || path.subtitle || path.description || '' };
}

export default async function LearningPathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_learning_path_get_by_slug', { p_slug: slug });
  if (error || !data) notFound();

  const result = data as any;
  const path = result.path;
  if (!path) notFound();
  const courses = result.courses || [];
  const isEnrolled = result.is_enrolled;
  const n = path.narrative || {};
  const advantages: string[] = Array.isArray(n.advantages) ? n.advantages : [];
  const outcomes: string[] = Array.isArray(n.outcomes) ? n.outcomes : [];

  const diffClass = path.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700'
    : path.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Link href={'/aprender/percursos' as any} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
        <ChevronLeft className="h-4 w-4" /> {t('path.all_paths')}
      </Link>

      {/* HERO */}
      <AppPageHeader title={path.title} description={n.tagline || path.subtitle || undefined} />

      {/* OUTCOMES — the payoff */}
      {outcomes.length > 0 && (
        <section className="mb-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 sm:p-7">
          <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-emerald-600" /> {t('path.outcomes_h')}</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {outcomes.map((o, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" /><span>{o}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* RATIONALE + AUDIENCE */}
      {(n.rationale || n.audience) && (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-500" /> {t('path.rationale_h')}</h2>
          {n.rationale && <p className="text-slate-700 leading-relaxed">{n.rationale}</p>}
          {n.audience && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm bg-violet-50 text-violet-800 rounded-full px-4 py-2">
              <Target className="h-4 w-4" /> <span className="font-medium">{t('path.audience_label')}:</span> {n.audience}
            </div>
          )}
        </section>
      )}

      {/* ADVANTAGES */}
      {advantages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-500" /> {t('path.advantages_h')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {advantages.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-fuchsia-100 text-fuchsia-700 font-bold text-sm flex-shrink-0">{i + 1}</span>
                <p className="text-sm text-slate-700">{a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* JOURNEY — timeline */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><BookOpen className="h-5 w-5 text-violet-600" /> {t('path.journey_h')}</h2>
        <p className="text-sm text-slate-500 mb-5">{t('path.journey_sub')}</p>
        {courses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">{t('path.courses_soon')}</div>
        ) : (
          <ol className="relative border-l-2 border-violet-100 ml-4 space-y-5">
            {courses.map((c: any, idx: number) => (
              <li key={c.id} className="ml-6">
                <span className="absolute -left-[1.05rem] flex items-center justify-center h-8 w-8 rounded-full bg-violet-600 text-white text-sm font-bold ring-4 ring-white">{idx + 1}</span>
                <Link href={`/curso/${c.id}` as any}
                  className="group block rounded-2xl border border-slate-200 bg-white p-5 hover:border-violet-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.emoji || '📘'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors">{c.title}</h3>
                      <div className="text-[11px] text-slate-400 mt-0.5">{[c.level, c.duration].filter(Boolean).join(' · ')}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                  {c.why && (
                    <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border-l-2 border-violet-200">
                      <span className="font-medium text-violet-700">{t('path.why_step')}:</span> {c.why}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 sm:p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t('path.cta_h')}</h2>
        <p className="text-sm text-slate-600 mb-5 max-w-xl mx-auto">{t('path.cta_sub')}</p>
        <div className="flex justify-center"><EnrollPathButton pathId={path.id} isEnrolled={isEnrolled} /></div>
      </section>
    </div>
  );
}

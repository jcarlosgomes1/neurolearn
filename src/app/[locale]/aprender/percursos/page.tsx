import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { GraduationCap, Clock, Users, BookOpen, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { PathsEmptyState } from '@/components/paths/PathsEmptyState';

export const revalidate = 300;

export const metadata = {
  title: 'Percursos de aprendizagem',
  description: 'Sequências curadas de cursos com racional, vantagens e outcome final para chegares ao nível seguinte.',
};

const DIFF_KEY: Record<string, string> = {
  beginner: 'path.diff_beginner',
  intermediate: 'path.diff_intermediate',
  advanced: 'path.diff_advanced',
};
const DIFF_CLASS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
};

export default async function LearningPathsPublicPage() {
  const t = await getTranslations();
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_learning_paths_public_list');
  const paths = (error || !Array.isArray(data)) ? [] : data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* HERO */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 text-white px-6 py-12 sm:py-16 mb-10 text-center animate-fade-in">
        <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-10 w-72 h-72 rounded-full bg-fuchsia-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/15 backdrop-blur mb-4 ring-1 ring-white/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance">{t('path.h1')}</h1>
          <p className="mt-3 text-base sm:text-lg text-white/85 max-w-2xl mx-auto text-pretty">{t('path.sub')}</p>
        </div>
      </header>

      {paths.length === 0 ? (
        <PathsEmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paths.map((p: any, i: number) => (
            <Link key={p.id} href={`/aprender/percursos/${p.slug}` as any}
              style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'both' }}
              className={`group relative flex flex-col rounded-2xl border bg-white p-6 animate-slide-up transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                p.featured ? 'border-violet-300 ring-2 ring-violet-200 md:col-span-2 lg:col-span-1' : 'border-slate-200 hover:border-violet-300'
              }`}>
              {p.featured && (
                <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow">
                  <Trophy className="h-3 w-3" /> {t('path.featured_badge')}
                </span>
              )}
              <div className="flex items-start justify-between mb-3">
                <span className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl group-hover:scale-110 transition-transform">{p.emoji || '🎓'}</span>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${DIFF_CLASS[p.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                  {DIFF_KEY[p.difficulty] ? t(DIFF_KEY[p.difficulty]) : p.difficulty}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-violet-700 transition-colors">{p.title}</h3>
              {(p.tagline || p.subtitle) && <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 flex-1">{p.tagline || p.subtitle}</p>}

              {p.outcomes_count > 0 && (
                <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-1">
                  <Sparkles className="h-3 w-3" /> {t('path.outcomes_badge', { n: p.outcomes_count })}
                </div>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {t('bn.courses', { count: p.course_count })}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.estimated_hours}h</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.enrollment_count}</span>
                <ArrowRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

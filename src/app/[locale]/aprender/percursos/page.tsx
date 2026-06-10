import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { GraduationCap, Clock, Users, BookOpen, ChevronRight } from 'lucide-react';
import { PathsEmptyState } from '@/components/paths/PathsEmptyState';

export const revalidate = 300;

export const metadata = {
  title: 'Percursos de aprendizagem',
  description: 'Sequências curadas de cursos com prerequisites e progresso para chegares ao nível seguinte.',
};

const DIFF_KEY: Record<string, string> = {
  beginner: 'path.diff_beginner',
  intermediate: 'path.diff_intermediate',
  advanced: 'path.diff_advanced',
};

export default async function LearningPathsPublicPage() {
  const t = await getTranslations();
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_learning_paths_public_list');
  const paths = (error || !Array.isArray(data)) ? [] : data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-brand-600 text-white mb-3 shadow-lg">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">{t('path.h1')}</h1>
        <p className="text-slate-600 text-base sm:text-lg">{t('path.sub')}</p>
      </header>

      {paths.length === 0 ? (
        <PathsEmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.map((p: any) => (
            <Link key={p.id} href={`/aprender/percursos/${p.slug}` as any}
              className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-brand-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{p.emoji || '🎓'}</span>
                {p.category && <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{p.category}</span>}
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-brand-700 transition-colors">{p.title}</h3>
              {p.subtitle && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.subtitle}</p>}
              <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {t('bn.courses', { count: p.course_count })}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.estimated_hours}h</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.enrollment_count}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-semibold ${
                  p.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
                  p.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>{DIFF_KEY[p.difficulty] ? t(DIFF_KEY[p.difficulty]) : p.difficulty}</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

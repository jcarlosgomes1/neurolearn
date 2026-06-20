import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { GraduationCap } from 'lucide-react';
import { PathsEmptyState } from '@/components/paths/PathsEmptyState';
import { PathsGrid } from './PathsGrid';

export const revalidate = 300;

export const metadata = {
  title: 'Percursos de aprendizagem',
  description: 'Sequências curadas de cursos com racional, vantagens e outcome final para chegares ao nível seguinte.',
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
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-indigo-300/10 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/15 backdrop-blur mb-4 ring-1 ring-white/30 animate-pulse">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-balance">{t('path.h1')}</h1>
          <p className="mt-3 text-base sm:text-lg text-white/85 max-w-2xl mx-auto text-pretty">{t('path.sub')}</p>
        </div>
      </header>

      {paths.length === 0 ? <PathsEmptyState /> : <PathsGrid paths={paths} />}
    </div>
  );
}

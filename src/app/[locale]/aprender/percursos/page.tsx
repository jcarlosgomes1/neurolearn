import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { PathsEmptyState } from '@/components/paths/PathsEmptyState';
import { PathsGrid } from './PathsGrid';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AppPageHeader title={t('path.h1')} description={t('path.sub')} />
      {paths.length === 0 ? <PathsEmptyState /> : <PathsGrid paths={paths} />}
    </div>
  );
}

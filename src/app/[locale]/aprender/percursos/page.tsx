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
    <div className="">
      <AppPageHeader title={t('path.h1')} description={t('path.sub')} />
      {paths.length === 0 ? <PathsEmptyState /> : <PathsGrid paths={paths} />}
    </div>
  );
}

import { LearnDashboard } from './LearnDashboard';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('learn.meta_title') };
}

export default function LearnPage() {
  return <LearnDashboard />;
}

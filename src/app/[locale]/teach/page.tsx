import { TeachDashboard } from './TeachDashboard';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('teach.meta_title') };
}

export default function TeachPage() {
  return <TeachDashboard />;
}

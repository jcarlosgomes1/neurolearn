import { JobsClient } from './JobsClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('jobs.meta_title') };
}

export default function Page() {
  return <JobsClient />;
}

import { AgentsClient } from './AgentsClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('agts.meta_title') };
}

export default function Page() {
  return <AgentsClient />;
}

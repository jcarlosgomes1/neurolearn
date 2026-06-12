import { EarningsClient } from './EarningsClient';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('teach.earnings.title') };
}

export default function Page() {
  return <EarningsClient />;
}

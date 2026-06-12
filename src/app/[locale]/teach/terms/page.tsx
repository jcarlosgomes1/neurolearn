import { TermsClient } from './TermsClient';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('teach.terms.title') };
}

export default function Page() {
  return <TermsClient />;
}

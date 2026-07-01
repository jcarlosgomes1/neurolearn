import { CandidaturasList } from './CandidaturasList';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.candidaturas') };
}

export default function Page() {
  return <div className="px-4 sm:px-6 lg:px-8"><CandidaturasList /></div>;
}

import { ComingSoon } from '@/components/shared/ComingSoon';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('nf.meta_title') };
}

export default async function LocaleNotFound() {
  const t = await getTranslations();
  return (
    <ComingSoon
      emoji="🔍"
      title={t('nf.title')}
      description={t('nf.description')}
    />
  );
}

import { MarketingView } from './MarketingView';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.marketing') };
}

export default function Page() {
  return <MarketingView />;
}

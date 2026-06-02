import { SocialView } from './SocialView';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.social') };
}

export default function Page() {
  return <SocialView />;
}

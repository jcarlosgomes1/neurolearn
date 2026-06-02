import { CmsView } from './CmsView';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.cms') };
}

export default function Page() {
  return <CmsView />;
}

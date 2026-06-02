import { VideoSetupView } from './VideoSetupView';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.video') };
}

export default function Page() {
  return <VideoSetupView />;
}

import { PreviewView } from './PreviewView';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.preview') };
}

export default function Page() {
  return <PreviewView />;
}

import { CursosClient } from './CursosClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.cursos') };
}

export default function Page() {
  return <CursosClient />;
}

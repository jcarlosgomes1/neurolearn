import { AdminCockpit } from './AdminCockpit';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.cockpit') };
}

export default function AdminPage() {
  return <AdminCockpit />;
}

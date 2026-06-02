import { AdminInstructors } from './AdminInstructors';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.instrutores') };
}

export default function AdminInstructorsPage() {
  return <AdminInstructors />;
}

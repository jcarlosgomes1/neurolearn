import { AdminList } from '../AdminList';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('jobs.meta_title') };
}

export default async function Page() {
  const t = await getTranslations();
  return (
    <AdminList
      title={t('jobs.title')}
      action="list_jobs"
      dataKey="rows"
      columns={[
        { key: 'job_type', label: t('jobs.col_type'), primary: true },
        { key: 'status', label: t('jobs.col_status'), kind: 'badge' },
        { key: 'created_at', label: t('jobs.col_created'), kind: 'reltime' },
      ]}
    />
  );
}

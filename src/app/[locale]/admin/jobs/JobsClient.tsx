'use client';

import { useTranslations } from 'next-intl';
import { AdminList } from '../AdminList';

export function JobsClient() {
  const t = useTranslations();
  return (
    <AdminList
      title={t('jobs.title')}
      action="list_jobs"
      dataKey="rows"
      backHref="/admin"
      columns={[
        { key: 'job_type', label: t('jobs.col_type'), primary: true },
        { key: 'status', label: t('jobs.col_status'), kind: 'badge' },
        { key: 'created_at', label: t('jobs.col_created'), kind: 'reltime' },
      ]}
    />
  );
}

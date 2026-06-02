'use client';

import { useTranslations } from 'next-intl';
import { AdminList } from '../AdminList';

export function AgentsClient() {
  const t = useTranslations();
  return (
    <AdminList
      title={t('agts.title')}
      action="list_agents"
      dataKey="agents"
      backHref="/admin"
      columns={[
        { key: 'name', label: t('agts.col_name'), primary: true },
        { key: 'status', label: t('agts.col_status'), kind: 'badge' },
        { key: 'last_active_at', label: t('agts.col_last'), kind: 'reltime' },
      ]}
    />
  );
}

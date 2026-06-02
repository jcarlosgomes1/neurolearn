import { AdminList } from '../AdminList';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('agentes.meta_title') };
}

export default async function Page() {
  const t = await getTranslations();
  return (
    <AdminList
      title={t('agentes.title')}
      action="list_agents"
      dataKey="agents"
      backHref="/admin"
      columns={[
        { key: 'name', label: t('agentes.col_name'), primary: true },
        { key: 'status', label: t('agentes.col_status'), kind: 'badge' },
        { key: 'last_active_at', label: t('agentes.col_last_active'), kind: 'reltime' },
      ]}
    />
  );
}

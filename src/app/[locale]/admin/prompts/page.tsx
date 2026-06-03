import { AppShell } from '@/components/layout/AppShell';
import { PromptsView } from './PromptsView';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('prompts_admin');
  return { title: t('page_title') };
}

export default function Page() {
  return (
    <AppShell role="admin">
      <PromptsView />
    </AppShell>
  );
}

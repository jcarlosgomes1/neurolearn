import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { IntegrationsClient } from './IntegrationsClient';

// Sem cache: as integrações são state crítico do admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { redirect({ href: '/login', locale }); return null; }

  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) {
    redirect({ href: '/conta', locale });
    return null;
  }

  const t = await getTranslations();
  const { data: integrations } = await sb.rpc('nl_admin_integrations_list');

  return (
    <AppShell role="admin" pageTitle={t('integrations.title')}>
      <IntegrationsClient initial={integrations || []} />
    </AppShell>
  );
}

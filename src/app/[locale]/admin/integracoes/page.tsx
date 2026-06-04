import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { IntegrationsClient } from './IntegrationsClient';

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

  const { data: integrations } = await sb.rpc('nl_admin_integrations_list');
  return <IntegrationsClient initial={integrations || []} />;
}

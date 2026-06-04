import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listSubscriptionsAction } from './actions';
import { SubscriptionsClient } from './SubscriptionsClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);
  
  const [{ data: subs }, { data: plans }, { data: orgs }] = await Promise.all([
    sb.rpc('nl_admin_subscriptions_list'),
    sb.rpc('nl_admin_billing_plans_list'),
    sb.from('nl_organizations').select('id, name, slug').eq('archived', false).order('name'),
  ]);
  return <SubscriptionsClient initial={(subs as any[]) || []} plans={(plans as any[]) || []} orgs={(orgs as any[]) || []} />;
}

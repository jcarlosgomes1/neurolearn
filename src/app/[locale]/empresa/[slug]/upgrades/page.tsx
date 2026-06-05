import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { UpgradesClient } from './UpgradesClient';

export const metadata = { title: 'Upgrades · Empresa' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug, plan').eq('slug', slug).maybeSingle();
  if (!org) notFound();
  const { data: member } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!member) redirect(`/${locale}/empresa/${slug}`);
  const { data: features } = await sb.from('nl_org_features').select('*').eq('org_id', org.id).maybeSingle();
  const { data: addonsRpc } = await sb.rpc('nl_addons_list', { p_applies_to: 'b2b' });
  const { data: subscriptions } = await sb.from('nl_org_addon_subscriptions').select('*, nl_pricing_addons(*)').eq('org_id', org.id).eq('status', 'active');
  
  return (
    <>
      <Header />
      <UpgradesClient orgId={org.id} orgName={org.name} orgSlug={slug} memberRole={member.role}
        features={features || {}} addons={(addonsRpc as any)?.addons || []}
        active={subscriptions || []} locale={locale} />
    </>
  );
}

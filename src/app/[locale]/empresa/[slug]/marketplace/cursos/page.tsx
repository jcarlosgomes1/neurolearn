import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { browseMarketplaceCoursesAction } from '../../marketplace-actions';
import { Header } from '@/components/layout/Header';
import { MarketplaceCursosClient } from './MarketplaceCursosClient';

export const metadata = { title: 'Marketplace de Cursos · Empresa' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/empresa/${slug}/marketplace/cursos`);
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('slug', slug).maybeSingle();
  if (!org) notFound();
  const { data: member } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!member) redirect(`/${locale}/empresa/${slug}`);
  const { data: features } = await sb.from('nl_org_features').select('enable_marketplace_b2c, max_marketplace_seats').eq('org_id', org.id).maybeSingle();
  
  const initial = await browseMarketplaceCoursesAction({});
  return (
    <>
      <Header />
      <MarketplaceCursosClient orgId={org.id} orgName={org.name} orgSlug={slug} memberRole={member.role}
        featureEnabled={!!features?.enable_marketplace_b2c} maxSeats={features?.max_marketplace_seats || 0}
        locale={locale} initial={initial.ok ? initial : { total: 0, courses: [] }} />
    </>
  );
}

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { browseInstructorServicesAction } from '../../corporate-actions';
import { MarketplaceInstrutoresClient } from './MarketplaceInstrutoresClient';

export const metadata = { title: 'Marketplace Instrutores · Empresa' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/empresa/${slug}/marketplace/instrutores`);
  
  // Validar org + member + feature flag
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('slug', slug).maybeSingle();
  if (!org) notFound();
  
  const { data: member } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!member) redirect(`/${locale}/empresa/${slug}`);
  
  const { data: features } = await sb.from('nl_org_features').select('enable_instructor_corporate').eq('org_id', org.id).maybeSingle();
  
  const initial = await browseInstructorServicesAction({});
  
  return (
    <>
      <MarketplaceInstrutoresClient 
        orgId={org.id} 
        orgName={org.name}
        orgSlug={slug}
        memberRole={member.role}
        featureEnabled={!!features?.enable_instructor_corporate}
        locale={locale} 
        initial={initial.ok ? initial : { total: 0, services: [] }} 
      />
    </>
  );
}

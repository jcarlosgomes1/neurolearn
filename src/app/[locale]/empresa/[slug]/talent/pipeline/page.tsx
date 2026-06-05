import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listOrgPlacementsAction } from '../../talent-actions';
import { Header } from '@/components/layout/Header';
import { PipelineClient } from './PipelineClient';

export const metadata = { title: 'Pipeline Talent · Empresa' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('slug', slug).maybeSingle();
  if (!org) notFound();
  const { data: member } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!member) redirect(`/${locale}/empresa/${slug}`);
  
  const r = await listOrgPlacementsAction(org.id);
  return (
    <>
      <Header />
      <PipelineClient orgId={org.id} orgSlug={slug} memberRole={member.role}
        locale={locale} placements={r.ok ? r.placements : []} />
    </>
  );
}

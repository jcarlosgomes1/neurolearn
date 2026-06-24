import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { browseTalentAction } from '../talent-actions';
import { TalentBrowseClient } from './TalentBrowseClient';

export const metadata = { title: 'Talent · Empresa' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/empresa/${slug}/talent`);
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('slug', slug).maybeSingle();
  if (!org) notFound();
  const { data: member } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!member) redirect(`/${locale}/empresa/${slug}`);
  const { data: features } = await sb.from('nl_org_features').select('enable_talent_hire').eq('org_id', org.id).maybeSingle();
  const { data: jobs } = await sb.from('nl_job_postings').select('id, title, required_skills').eq('org_id', org.id).eq('status', 'open').order('created_at', { ascending: false });
  
  const initial = await browseTalentAction(org.id, {});
  return (
    <>
      <TalentBrowseClient orgId={org.id} orgName={org.name} orgSlug={slug} memberRole={member.role}
        featureEnabled={!!features?.enable_talent_hire} jobs={jobs || []}
        locale={locale} initial={initial.ok ? initial : { total: 0, talents: [] }} />
    </>
  );
}

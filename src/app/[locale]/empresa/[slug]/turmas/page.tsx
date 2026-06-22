import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { CohortsClient } from './CohortsClient';

export const dynamic = 'force-dynamic';

export default async function CohortsPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/turmas`);

  const { data: org } = await sb.from('nl_organizations').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (!org) notFound();

  const { data: isOrgAdmin } = await sb.rpc('nl_is_org_admin', { p_org: org.id });
  const { data: isPlatformAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isOrgAdmin && !isPlatformAdmin) redirect(`/empresa/${slug}`);

  const [{ data: cohorts }, { data: members }, { data: paths }] = await Promise.all([
    sb.rpc('nl_cohorts_list', { p_org_id: org.id }),
    sb.rpc('nl_my_org_members_list', { p_org_id: org.id }),
    sb.rpc('nl_my_org_paths'),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/empresa/${slug}`}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <AppPageHeader eyebrow={t('empresa.cohorts.eyebrow')} title={t('empresa.cohorts.title')} description={t('empresa.cohorts.description')} />
      <CohortsClient
        orgId={org.id}
        cohorts={Array.isArray(cohorts) ? cohorts : []}
        members={Array.isArray(members) ? members : []}
      />
    </div>
  );
}

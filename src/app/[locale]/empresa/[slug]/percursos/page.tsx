import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { OrgPathsClient } from './OrgPathsClient';

export const dynamic = 'force-dynamic';

export default async function OrgPathsPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/percursos`);

  const { data: org } = await sb.from('nl_organizations').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (!org) notFound();

  const [{ data: isMember }, { data: isPlatformAdmin }, { data: canManageRaw }] = await Promise.all([
    sb.rpc('nl_is_org_member', { p_org: org.id }),
    sb.rpc('nl_is_platform_admin'),
    sb.rpc('nl_org_can_manage_training', { p_org: org.id }),
  ]);
  if (!isMember && !isPlatformAdmin) redirect(`/empresa/${slug}`);
  const canManage = !!canManageRaw || !!isPlatformAdmin;

  const [{ data: assignedRes }, { data: catalog }] = await Promise.all([
    sb.rpc('nl_org_assigned_paths', { p_org_id: org.id }),
    sb.rpc('nl_learning_paths_public_list'),
  ]);
  const assigned = ((assignedRes as { paths?: unknown[] })?.paths || []) as never[];
  const catalogList = (Array.isArray(catalog) ? catalog : []) as never[];

  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/empresa/${slug}`}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <AppPageHeader eyebrow={safeT('empresa.paths.eyebrow', 'Empresa · Percursos')} title={safeT('empresa.paths.title', 'Percursos para a equipa')} description={safeT('empresa.paths.description', 'Atribui percursos de aprendizagem à tua equipa, define formação obrigatória e acompanha o progresso.')} />

      <OrgPathsClient orgId={org.id} canManage={canManage} initialAssigned={assigned} catalog={catalogList} />
    </div>
  );
}

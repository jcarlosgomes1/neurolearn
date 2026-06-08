import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { ProposalsClient } from './ProposalsClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/propostas`);

  const { data: org } = await sb.from('nl_organizations').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (!org) notFound();

  const { data: isMember } = await sb.rpc('nl_is_org_member', { p_org_id: org.id });
  const { data: isPlatformAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isMember && !isPlatformAdmin) redirect(`/empresa/${slug}`);

  const { data: proposals } = await sb.rpc('nl_org_proposals_list', { p_org_id: org.id });
  const { data: isOrgAdmin } = await sb.rpc('nl_is_org_admin', { p_org_id: org.id });

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={{ pathname: '/empresa/[slug]', params: { slug } } as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="h-3.5 w-3.5" /> {safeT('empresa.propostas.eyebrow', 'Empresa · Propostas')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('empresa.propostas.title', 'Propostas de cursos')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('empresa.propostas.description', 'Combina documentos para gerar propostas de cursos. Aprovas e ficam disponíveis para a tua equipa.')}
        </p>
        <Link href={{ pathname: '/empresa/[slug]/conteudo', params: { slug: org.slug } } as any}
          className="inline-flex items-center gap-1.5 mt-3 text-xs text-emerald-700 hover:text-emerald-900 font-semibold">
          → Gerir documentos fonte
        </Link>
      </header>
      <ProposalsClient
        orgId={org.id}
        orgSlug={org.slug}
        isOrgAdmin={!!isOrgAdmin || !!isPlatformAdmin}
        proposals={Array.isArray(proposals) ? proposals : []}
      />
    </div>
  );
}

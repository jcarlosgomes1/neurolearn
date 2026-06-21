import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Quote } from 'lucide-react';
import { OrgProvaSocialClient } from './OrgProvaSocialClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/prova-social`);
  const { data: org } = await sb.from('nl_organizations').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (!org) notFound();
  const { data: isOrgAdmin } = await sb.rpc('nl_is_org_admin', { p_org_id: org.id });
  const { data: isPlatformAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isOrgAdmin && !isPlatformAdmin) redirect(`/empresa/${slug}`);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/empresa/${slug}` as never} className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1"><Quote className="h-3.5 w-3.5" /> Prova social</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Testemunhos da tua organização</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">Promove avaliações reais dos teus cursos. Só conteúdo real é aprovável; o uso identificado exige consentimento do autor.</p>
      </header>
      <OrgProvaSocialClient orgId={org.id} lang={locale} />
    </div>
  );
}

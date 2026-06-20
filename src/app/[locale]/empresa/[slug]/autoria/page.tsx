import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, PenLine } from 'lucide-react';
import { AuthoringClient } from './AuthoringClient';

export const dynamic = 'force-dynamic';

export default async function AuthoringPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/autoria`);

  const { data: org } = await sb.from('nl_organizations').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (!org) notFound();

  const { data: isMember } = await sb.rpc('nl_is_org_member', { p_org: org.id });
  const { data: isOrgAdmin } = await sb.rpc('nl_is_org_admin', { p_org_id: org.id });
  const { data: isPlatformAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isMember && !isPlatformAdmin) redirect(`/empresa/${slug}`);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href={`/empresa/${slug}`}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <PenLine className="h-3.5 w-3.5" /> {safeT('academy.authoring.eyebrow', 'Academia · Autoria')}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{safeT('academy.authoring.page_title', 'Autoria de conteúdo')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('academy.authoring.page_desc', 'Convoca especialistas internos para criar e validar formação — com reconhecimento.')}
        </p>
      </header>
      <AuthoringClient orgId={org.id} orgSlug={org.slug} isAdmin={!!(isOrgAdmin || isPlatformAdmin)} />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { OrgStudioClient } from './OrgStudioClient';

export const dynamic = 'force-dynamic';

export default async function OrgStudioPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/estudio`);

  const { data: org } = await sb.from('nl_organizations').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (!org) notFound();

  const { data: canUse } = await sb.rpc('nl_org_studio_can_use', { p_org: org.id });
  const { data: isPlatformAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!canUse && !isPlatformAdmin) redirect(`/empresa/${slug}`);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href={`/empresa/${slug}`} className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <AppPageHeader eyebrow={safeT('org_studio.eyebrow', 'Academia · Estúdio')} title={safeT('org_studio.title', 'Estúdio de conteúdo')} description={safeT('org_studio.desc', 'Gera cursos a partir dos teus materiais, enriquece com auxiliares de estudo e grava vídeo de instrução — tudo na plataforma.')} />
      <OrgStudioClient orgId={org.id} orgSlug={org.slug} />
    </div>
  );
}

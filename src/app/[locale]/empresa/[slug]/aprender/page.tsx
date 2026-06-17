import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MyAcademyClient } from './MyAcademyClient';

export const dynamic = 'force-dynamic';

export default async function MyAcademyPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/aprender`);

  const { data: org } = await sb.from('nl_organizations').select('id, slug, name, primary_color').eq('slug', slug).maybeSingle();
  if (!org) notFound();

  const { data: isMember } = await sb.rpc('nl_is_org_member', { p_org: org.id });
  const { data: isPlatformAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isMember && !isPlatformAdmin) redirect(`/empresa/${slug}`);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <Link href={`/empresa/${slug}`}
          className="group inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
        </Link>
      </div>
      <MyAcademyClient orgId={org.id} orgSlug={org.slug} orgName={org.name} brand={org.primary_color || '#6366f1'} />
    </div>
  );
}

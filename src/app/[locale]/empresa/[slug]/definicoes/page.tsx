import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { DefinicoesClient } from './DefinicoesClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=/empresa/${slug}/definicoes`);
  const { data: org } = await sb.from('nl_organizations')
    .select('id, slug, name, legal_name, country_code, vat_number, logo_url, primary_color')
    .eq('slug', slug).maybeSingle();
  if (!org) notFound();
  const [{ data: isOrgAdmin }, { data: isPlatformAdmin }] = await Promise.all([
    sb.rpc('nl_is_org_admin', { p_org: org.id }),
    sb.rpc('nl_is_platform_admin'),
  ]);
  if (!isOrgAdmin && !isPlatformAdmin) redirect(`/empresa/${slug}`);
  return <DefinicoesClient org={org as any} />;
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BundlesClient } from './BundlesClient';

export const metadata = { title: 'Bundles · Admin' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);
  const { data: bundlesR } = await sb.rpc('nl_admin_bundles_list');
  const { data: coursesR } = await sb.from('nl_courses').select('id, title, price_cents, currency, emoji').eq('published', true).eq('archived', false).order('title');
  return <BundlesClient initial={(bundlesR as any)?.bundles || []} courses={coursesR || []} />;
}

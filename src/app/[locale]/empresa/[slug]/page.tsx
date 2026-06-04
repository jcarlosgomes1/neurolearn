import { redirect } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { OrgDashboard } from './OrgDashboard';

export const metadata = { title: 'Workspace' };

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: `/login?next=/empresa/${slug}` as any, locale });

  const { data: details, error } = await sb.rpc('nl_org_details', { p_slug: slug });
  if (error || !details || !(details as any).ok) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <OrgDashboard data={details} />
      </main>
    </>
  );
}

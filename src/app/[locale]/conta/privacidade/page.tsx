import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PrivacidadeClient } from './PrivacidadeClient';

export const metadata = { title: 'Privacidade · NeuroLearn', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: reqs } = await sb.rpc('nl_gdpr_my_requests');
  return (
    <>
      <PrivacidadeClient email={user.email || ''} requests={(reqs as any)?.requests || []} />
    </>
  );
}

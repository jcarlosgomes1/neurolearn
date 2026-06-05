import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { SubscriptionClient } from './SubscriptionClient';

export const metadata = { title: 'Subscription · NeuroLearn' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/conta/subscription`);
  const { data } = await sb.rpc('nl_my_subscription');
  return (
    <>
      <Header />
      <SubscriptionClient initial={data as any} />
    </>
  );
}

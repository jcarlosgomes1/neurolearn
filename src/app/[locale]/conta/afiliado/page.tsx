import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { AfiliadoClient } from './AfiliadoClient';

export const metadata = { title: 'Programa de Afiliados · NeuroLearn' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/conta/afiliado`);
  const { data } = await sb.rpc('nl_affiliate_my_dashboard');
  return (
    <>
      <Header />
      <AfiliadoClient initial={data as any} baseUrl="https://neurolearn-rosy.vercel.app" />
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { CreditsView } from './CreditsView';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';

export const metadata = { title: 'Os meus créditos · NeuroLearn' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <CreditsView />
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

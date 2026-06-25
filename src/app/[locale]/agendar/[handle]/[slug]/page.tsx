import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BookingForm } from './BookingForm';

export default async function Page({ params }: { params: Promise<{ handle: string; slug: string; locale: string }> }) {
  const { handle, slug, locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const blocks = await getHomeBlocks(locale);

  const { data: host } = await sb.rpc('nl_scheduling_host_by_handle', { p_handle: handle, p_lang: locale });
  if (!host?.ok) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white">
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-slate-900">404</h1>
            <p className="mt-3 text-slate-600">{t('sched.public.host_not_found')}</p>
          </div>
        </main>
        <Footer data={blocks.footer_brand || {}} />
      </>
    );
  }

  const link = (host.links as Array<{ slug: string }>).find((l) => l.slug === slug);
  if (!link) notFound();

  const { data: consentText } = await sb.rpc('nl_consent_text', { p_key: 'consent.marketing', p_lang: locale });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <BookingForm host={host.host} link={link as any} consentText={(consentText as string) || ''} />
      </main>
      <Footer data={blocks.footer_brand || {}} />
    </>
  );
}

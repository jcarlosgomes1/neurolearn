import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BookingForm } from './BookingForm';
import { SiteChrome } from '@/components/layout/SiteChrome';

export default async function Page({ params }: { params: Promise<{ handle: string; slug: string; locale: string }> }) {
  const { handle, slug, locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();

  const { data: host } = await sb.rpc('nl_scheduling_host_by_handle', { p_handle: handle, p_lang: locale });
  if (!host?.ok) {
    return (
      <SiteChrome locale={locale} mainClassName="min-h-screen bg-white" innerClassName="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">404</h1>
        <p className="mt-3 text-slate-600">{t('sched.public.host_not_found')}</p>
      </SiteChrome>
    );
  }

  const link = (host.links as Array<{ slug: string }>).find((l) => l.slug === slug);
  if (!link) notFound();

  const { data: consentText } = await sb.rpc('nl_consent_text', { p_key: 'consent.marketing', p_lang: locale });

  return (
    <SiteChrome locale={locale} mainClassName="min-h-screen bg-slate-50" wrapInner={false}>
      <BookingForm host={host.host} link={link as any} consentText={(consentText as string) || ''} />
    </SiteChrome>
  );
}

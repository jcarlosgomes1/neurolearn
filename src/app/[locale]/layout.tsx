import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { routing } from '@/i18n/routing';
import { OnboardingGate } from '@/components/auth/OnboardingGate';
import { CookieBanner } from '@/components/legal/CookieBanner';
import { Telemetry } from '@/components/telemetry/Telemetry';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { TopBar } from '@/components/layout/TopBar';
import { PeekBanner } from '@/components/peek/PeekBanner';
import '@/app/globals.css';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: {
      default: t('site.meta_title_default'),
      template: `%s · ${t('brand.name')}`,
    },
    description: t('site.meta_description'),
    metadataBase: new URL('https://neurolearn-rosy.vercel.app'),
    openGraph: {
      type: 'website',
      siteName: t('brand.name'),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased [overflow-x:clip]">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TopBar locale={locale} />
          <PeekBanner />
          <OnboardingGate />
          {children}
          <Toaster richColors position="top-right" />
          <CookieBanner />
          <Telemetry />
          <MobileBottomNav />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

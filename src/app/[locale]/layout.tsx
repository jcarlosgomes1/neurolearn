import { ClientIntlProvider } from '@/components/i18n/ClientIntlProvider';
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
import { createClient } from '@/lib/supabase/server';
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

  let theme = 'dir4';
  let themeMode = 'light';
  let themeCss = '';
  try {
    const sb = await createClient();
    const { data } = await sb.rpc('nl_design_active_full');
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.id) {
      theme = row.id;
      themeMode = row.mode || 'light';
      const t = row.tokens || {};
      const b = t.brand || {};
      const w = t.w || {};
      const brandVars = Object.keys(b).map((k) => `--brand-${k}:${b[k]};`).join('');
      themeCss =
        (row.font_import ? `@import url("${row.font_import}");` : '') +
        `:root{--font-body:${t.fbody};--font-display:${t.fdisplay};--font-num:${t.fnum};` +
        `--paper:${t.paper};--card:${t.card};--ink:${t.ink};--ink-2:${t.ink2};--ink-3:${t.ink3};--line:${t.line};` +
        `--accent:${t.accent};--accent-bright:${t.accentBright};--accent-tint:${t.accentTint};` +
        brandVars +
        `--w-display:${w.display||700};--w-h1:${w.h1||700};--w-h2:${w.h2||600};--w-h3:${w.h3||600};}`;
    }
  } catch {
    // fallback: dir4 (Atelier)
  }

  return (
    <html lang={locale} data-theme={theme} data-theme-mode={themeMode}>
      <body className="min-h-screen font-sans antialiased [overflow-x:clip]">
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <ClientIntlProvider locale={locale} messages={messages}>
          <TopBar locale={locale} />
          <PeekBanner />
          <OnboardingGate />
          {children}
          <Toaster richColors position="top-right" />
          <CookieBanner />
          <Telemetry />
          <MobileBottomNav />
        </ClientIntlProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

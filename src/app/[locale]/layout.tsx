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
import { TopLoader } from '@/components/ui/TopLoader';
import { PeekBanner } from '@/components/peek/PeekBanner';
import { createClient } from '@/lib/supabase/server';
import { PageEnter } from '@/components/motion/PageEnter';
import { AutoReveal } from '@/components/motion/AutoReveal';
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
  let motionOn = true;
  try {
    const sb = await createClient();
    const { data } = await sb.rpc('nl_design_active_full');
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.id) {
      theme = row.id;
      themeMode = row.mode || 'light';
      const t = row.tokens || {};
      const surf = (t.surface || {}) as Record<string, string>;
      motionOn = t.motion !== false;
      const b = t.brand || {};
      const w = t.w || {};
      const ndef: Record<string, string> = {'50':'250 249 246','100':'245 243 239','200':'232 228 222','300':'215 210 202','400':'168 161 151','500':'121 114 104','600':'88 82 74','700':'66 61 55','800':'41 37 33','900':'28 25 22','950':'14 12 10'};
      const nn = (t.neutral || {}) as Record<string, string>;
      const neutralVars = Object.keys(ndef).map((k) => `--n-${k}:${nn[k] || ndef[k]};`).join('');
      const brandVars = Object.keys(b).map((k) => `--brand-${k}:${b[k]};`).join('');
      themeCss =
        (row.font_import ? `@import url("${row.font_import}");` : '') +
        `:root{--font-body:${t.fbody};--font-display:${t.fdisplay};--font-num:${t.fnum};` +
        `--paper:${t.paper};--card:${t.card};--ink:${t.ink};--ink-2:${t.ink2};--ink-3:${t.ink3};--line:${t.line};` +
        `--accent:${t.accent};--accent-bright:${t.accentBright};--accent-tint:${t.accentTint};` +
        brandVars + neutralVars +
        `--w-display:${w.display||700};--w-h1:${w.h1||700};--w-h2:${w.h2||600};--w-h3:${w.h3||600};` +
        (surf.shadow ? `--nl-surface-shadow:${surf.shadow};` : '') +
        (surf.emboss ? `--nl-surface-shadow-emboss:${surf.emboss};` : '') +
        (surf.hover ? `--nl-surface-shadow-hover:${surf.hover};` : '') +
        `}`;
    }
  } catch {
    // fallback: dir4 (Atelier)
  }

  // Camada de movimento, governada pela direcao de design ativa (config-driven).
  const motionCss = motionOn
    ? `.nl-reveal{opacity:0;transform:translateY(18px);transition:opacity .65s ease,transform .65s cubic-bezier(.2,.7,.2,1)}.nl-reveal[data-shown="true"]{opacity:1;transform:none}@media (prefers-reduced-motion:reduce){.nl-reveal{opacity:1!important;transform:none!important;transition:none!important}}`
    : `.nl-reveal{opacity:1!important;transform:none!important;transition:none!important}.nl-page-enter{animation:none!important}`;

  // Superficies (alto-relevo tipo cartao), config-driven com defaults; uma direcao de design pode sobrepor via tokens.surface.
  const surfaceCss = ':root{--nl-surface-shadow:0 1px 3px rgba(15,23,42,.07),0 1px 2px rgba(15,23,42,.04);--nl-surface-shadow-emboss:inset 0 1px 0 rgba(255,255,255,.85),0 1px 3px rgba(15,23,42,.07),0 1px 2px rgba(15,23,42,.04);--nl-surface-shadow-hover:0 6px 16px rgba(15,23,42,.10),0 2px 6px rgba(15,23,42,.06)}.nl-surface{box-shadow:var(--nl-surface-shadow)}.nl-surface-emboss{box-shadow:var(--nl-surface-shadow-emboss)}.nl-surface-int{transition:box-shadow .2s ease,transform .2s ease}.nl-surface-int:hover{box-shadow:var(--nl-surface-shadow-hover);transform:translateY(-2px)}';

  return (
    <html lang={locale} data-theme={theme} data-theme-mode={themeMode} data-motion={motionOn ? 'on' : 'off'} className="[overflow-x:clip]">
      <body className="min-h-screen font-sans antialiased">
        <style dangerouslySetInnerHTML={{ __html: surfaceCss + themeCss + motionCss }} />
        <noscript><style dangerouslySetInnerHTML={{ __html: '.nl-reveal{opacity:1!important;transform:none!important}' }} /></noscript>
        <ClientIntlProvider locale={locale} messages={messages}>
          <TopBar locale={locale} />
          <TopLoader />
          <PeekBanner />
          <OnboardingGate />
          <PageEnter>{children}</PageEnter>
          <AutoReveal />
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

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';

interface SiteChromeProps {
  locale: string;
  appTitle?: string;
  appSubtitle?: string;
  publicHero?: ReactNode;
  mainClassName?: string;
  wrapInner?: boolean;
  innerClassName?: string;
  children: ReactNode;
}

/**
 * Chrome unico: utilizador autenticado ve o AppShell (sidebar); visitante deslogado ve o header/footer de marketing.
 * Para paginas publicas que tambem sao usadas dentro do produto (cursos, pesquisa, agendar).
 */
export async function SiteChrome({
  locale,
  appTitle,
  appSubtitle,
  publicHero,
  mainClassName = 'min-h-screen bg-white',
  wrapInner = true,
  innerClassName = 'max-w-6xl mx-auto px-4 py-8 sm:py-12',
  children,
}: SiteChromeProps) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  if (user) {
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
    const role: 'admin' | 'instructor' | 'student' =
      profile?.role === 'admin' || profile?.role === 'super_admin'
        ? 'admin'
        : profile?.role === 'instructor'
        ? 'instructor'
        : 'student';
    return (
      <AppShell role={role}>
        {appTitle ? <AppPageHeader title={appTitle} description={appSubtitle} /> : null}
        {children}
      </AppShell>
    );
  }

  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className={mainClassName}>
        {publicHero}
        {wrapInner ? <div className={innerClassName}>{children}</div> : children}
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

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
 * Chrome unico para paginas publicas que tambem sao usadas dentro do produto (cursos, pesquisa, agendar).
 * Utilizador autenticado: AppShell na vista de ALUNO (sao paginas de navegacao do aluno; a gestao
 * admin/instrutor vive nas suas proprias areas) -> sidebar, badge e espacamento de aluno consistentes,
 * sem flipar para admin no caso do super_admin. Visitante deslogado: header/footer de marketing.
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
    return (
      <AppShell role="student">
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

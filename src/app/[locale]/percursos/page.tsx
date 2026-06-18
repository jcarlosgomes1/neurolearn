import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { GraduationCap } from 'lucide-react';
import { PathsEmptyState } from '@/components/paths/PathsEmptyState';
import { PathsGrid } from '../aprender/percursos/PathsGrid';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

export const revalidate = 300;

const SITE_URL = 'https://neurolearn-rosy.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = 'Percursos de aprendizagem · NeuroLearn';
  const desc = 'Sequências curadas de cursos com racional, vantagens e resultado final para chegares ao nível seguinte.';
  return {
    title, description: desc,
    alternates: {
      canonical: `${SITE_URL}/${locale}/percursos`,
      languages: {
        'pt': `${SITE_URL}/pt/percursos`,
        'en': `${SITE_URL}/en/percursos`,
        'es': `${SITE_URL}/es/percursos`,
        'fr': `${SITE_URL}/fr/percursos`,
      },
    },
    openGraph: {
      type: 'website', title, description: desc,
      url: `${SITE_URL}/${locale}/percursos`, siteName: 'NeuroLearn',
      images: [`${SITE_URL}/${locale}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

export default async function PublicLearningPathsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_learning_paths_public_list');
  const paths = (error || !Array.isArray(data)) ? [] : data;
  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <BreadcrumbStructuredData items={[
        { name: 'Início', href: `/${locale}` },
        { name: t('nav.learning_paths'), href: `/${locale}/percursos` },
      ]} baseUrl={SITE_URL} />
      <Header />
      <main className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 text-white px-6 py-12 sm:py-16 mb-10 text-center animate-fade-in">
            <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -right-10 w-72 h-72 rounded-full bg-fuchsia-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="relative">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/15 backdrop-blur mb-4 ring-1 ring-white/30 animate-pulse">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance">{t('path.h1')}</h1>
              <p className="mt-3 text-base sm:text-lg text-white/85 max-w-2xl mx-auto text-pretty">{t('path.sub')}</p>
            </div>
          </header>
          {paths.length === 0 ? <PathsEmptyState /> : <PathsGrid paths={paths} basePath="/percursos" />}
        </div>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

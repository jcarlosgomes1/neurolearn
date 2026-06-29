import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { PathsEmptyState } from '@/components/paths/PathsEmptyState';
import { PathsGrid } from '../aprender/percursos/PathsGrid';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHero } from '@/components/shared/PageHero';
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
      <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
        <PageHero badge={t('nav.learning_paths')} title={t('path.h1')} subtitle={t('path.sub')} />
        <section className="mx-auto px-4 py-10" style={{ maxWidth: 'var(--page-max, 72rem)' }}>
          {paths.length === 0 ? <PathsEmptyState /> : <PathsGrid paths={paths} basePath="/percursos" />}
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

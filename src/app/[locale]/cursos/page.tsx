import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHero } from '@/components/shared/PageHero';
import { CatalogClient } from './CatalogClient';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

export const revalidate = 60;

const SITE_URL = 'https://neurolearn-rosy.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations();
  const title = t('catalog.meta_title');
  const desc = t('catalog.meta_desc');
  return {
    title, description: desc,
    alternates: {
      canonical: `${SITE_URL}/${locale}/cursos`,
      languages: {
        'pt': `${SITE_URL}/pt/cursos`,
        'en': `${SITE_URL}/en/cursos`,
        'es': `${SITE_URL}/es/cursos`,
        'fr': `${SITE_URL}/fr/cursos`,
      },
    },
    openGraph: {
      type: 'website', title, description: desc,
      url: `${SITE_URL}/${locale}/cursos`, siteName: 'NeuroLearn',
      images: [`${SITE_URL}/${locale}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

// ItemList JSON-LD (catalog)
function CatalogItemList({ courses, locale }: { courses: any[]; locale: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: courses.slice(0, 20).map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE_URL}/${locale}/curso/${c.id}`,
      name: c.title,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function CoursesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ cat?: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: courses } = await sb.rpc('nl_courses_catalog', { p_lang: locale });
  const { data: cats } = await sb.rpc('nl_course_categories_list', { p_lang: locale });
  const { data: rmRaw } = await sb.rpc('nl_platform_config_get', { p_key: 'rating_min_display' });
  const { data: emRaw } = await sb.rpc('nl_platform_config_get', { p_key: 'enroll_min_display' });
  const ratingMin = parseInt((rmRaw as string) || '5', 10) || 5;
  const enrollMin = parseInt((emRaw as string) || '25', 10) || 25;
  const sp = await searchParams;
  const initialCat = sp?.cat || 'all';
  const blocks = await getHomeBlocks(locale);
  const courseList = courses || [];

  return (
    <>
      <BreadcrumbStructuredData items={[
        { name: 'Início', href: `/${locale}` },
        { name: t('nav.courses'), href: `/${locale}/cursos` },
      ]} baseUrl={SITE_URL} />
      {courseList.length > 0 && <CatalogItemList courses={courseList} locale={locale} />}
      <Header />
      <main className="bg-white min-h-screen">
        <PageHero badge={t('catalog.badge')} title={t('catalog.title')} subtitle={t('catalog.subtitle')} />
        <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <CatalogClient courses={courseList} cats={cats || []} initialCat={initialCat} ratingMin={ratingMin} enrollMin={enrollMin} />
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { CatalogClient } from './CatalogClient';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('catalog.meta_title'), description: t('catalog.meta_desc') };
}

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: courses } = await sb
    .from('nl_courses')
    .select('id, title, subtitle, emoji, price_cents, currency, rating_avg, enrollments_count, level, course_type, category, topics')
    .eq('published', true)
    .eq('archived', false)
    .order('featured', { ascending: false })
    .order('rating_avg', { ascending: false, nullsFirst: false })
    .limit(96);
  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <PageHeader badge={t('catalog.badge')} title={t('catalog.title')} subtitle={t('catalog.subtitle')} />
        <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <CatalogClient courses={courses || []} />
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

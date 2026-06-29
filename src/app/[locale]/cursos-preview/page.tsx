import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { CatalogPreviewClient } from './CatalogPreviewClient';

export const dynamic = 'force-dynamic';

export default async function CoursesPreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: courses } = await sb.rpc('nl_courses_catalog_v2', { p_lang: locale });
  const { data: cats } = await sb.rpc('nl_course_categories_list', { p_lang: locale });
  const { data: rmRaw } = await sb.rpc('nl_platform_config_get', { p_key: 'rating_min_display' });
  const { data: emRaw } = await sb.rpc('nl_platform_config_get', { p_key: 'enroll_min_display' });
  const ratingMin = parseInt((rmRaw as string) || '5', 10) || 5;
  const enrollMin = parseInt((emRaw as string) || '25', 10) || 25;
  const courseList = courses || [];
  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="min-h-screen" style={{ backgroundColor: 'rgb(250 249 245)' }}>
        {/* Cabeçalho editorial */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-8 sm:pt-16 sm:pb-10">
          <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgb(180 88 58)' }}>{t('catalog.badge')}</span>
          <h1 className="font-display font-bold tracking-[-0.02em] text-balance mt-3" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1.02, color: 'rgb(28 25 22)' }}>
            {t('catalog.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty" style={{ fontSize: '1.2rem', lineHeight: 1.5, color: 'rgb(92 84 76)' }}>
            {t('catalog.subtitle')}
          </p>
        </section>
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
          <CatalogPreviewClient courses={courseList} cats={cats || []} ratingMin={ratingMin} enrollMin={enrollMin} />
        </section>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-10">
          <div className="rounded-xl px-4 py-3 text-xs text-center" style={{ backgroundColor: 'rgb(245 243 239)', color: 'rgb(154 144 133)' }}>
            Pré-visualização — catálogo reestruturado (cards com imagem, cabeçalho editorial). Não substitui /cursos.
          </div>
        </div>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { CourseCard } from '@/components/shared/CourseCard';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;
export const metadata = { title: 'Todos os cursos', description: 'Explora todos os cursos de IA da NeuroLearn.' };

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: courses } = await sb
    .from('nl_courses')
    .select('id, title, subtitle, emoji, price_cents, currency, rating_avg, enrollments_count, level, course_type')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('rating_avg', { ascending: false, nullsFirst: false })
    .limit(48);
  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <PageHeader badge={t('catalog.badge')} title={t('catalog.title')} subtitle={t('catalog.subtitle')} />
        <section className="max-w-6xl mx-auto px-4 py-12">
          {!courses || courses.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg">{t('catalog.empty')}</p>
              <p className="text-sm mt-2">{t('catalog.empty_hint')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-6">{t('catalog.count_available', { count: courses.length })}</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => <CourseCard key={c.id} course={c} />)}
              </div>
            </>
          )}
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

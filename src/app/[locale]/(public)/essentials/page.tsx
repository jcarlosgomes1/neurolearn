import { seoMetadata } from '@/lib/seo';
import { PageHero } from '@/components/shared/PageHero';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/shared/CourseCard';
import { Rocket } from 'lucide-react';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  return seoMetadata('marketing', 'essentials', locale, { title: t('ess.meta_title') });
}

export default async function EssentialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: tracks } = await sb
    .from('nl_courses')
    .select('id, title, subtitle, emoji, price_cents, currency, rating_avg, enrollments_count, level, course_type')
    .eq('published', true)
    .or('course_type.eq.track,course_type.eq.essential')
    .order('rating_avg', { ascending: false, nullsFirst: false })
    .limit(24);
  const blocks = await getHomeBlocks(locale);

  return (
      <main className="bg-white min-h-screen">
        <PageHero badge={t('ess.badge')} title={t('ess.title')} subtitle={t('ess.subtitle')} />
        <section className="max-w-6xl mx-auto px-4 py-12">
          {!tracks || tracks.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-12 text-center">
              <div className="flex justify-center mb-4"><Rocket className="h-12 w-12" strokeWidth={1.5} /></div>
              <h2 className="t-h2">{t('ess.soon')}</h2>
              <p className="mt-4 text-brand-100 max-w-xl mx-auto text-pretty">{t('ess.soon_desc')}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={'/register' as any} className="bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors">{t('ess.cta_register')}</Link>
                <Link href={'/cursos' as any} className="border border-white/40 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">{t('ess.cta_pro')}</Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((tk) => <CourseCard key={tk.id} course={tk} />)}
            </div>
          )}
        </section>
      </main>
  );
}

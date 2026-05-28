import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { createClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/shared/CourseCard';

export const revalidate = 120;
export const metadata = { title: 'NeuroLearn Essentials' };

export default async function EssentialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
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
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <PageHeader badge="\u{1F193} Sempre gr\u00e1tis" title="NeuroLearn Essentials" subtitle="Fundamentos de IA gratuitos, sempre actualizados, curados pela nossa equipa. Come\u00e7a hoje, do zero ao avan\u00e7ado." />
        <section className="max-w-6xl mx-auto px-4 py-12">
          {!tracks || tracks.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-12 text-center">
              <div className="text-5xl mb-4">\u{1F680}</div>
              <h2 className="text-2xl sm:text-3xl font-bold">Em breve</h2>
              <p className="mt-4 text-brand-100 max-w-xl mx-auto text-pretty">Estamos a preparar as primeiras Essentials: Prompt Engineering, ChatGPT no Marketing, Automa\u00e7\u00e3o com n8n, e mais.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={'/register' as any} className="bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors">Criar conta gr\u00e1tis</Link>
                <Link href={'/cursos' as any} className="border border-white/40 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">Ver Pro Courses</Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((t) => <CourseCard key={t.id} course={t} />)}
            </div>
          )}
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

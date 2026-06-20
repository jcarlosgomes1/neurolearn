import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { createClient } from '@/lib/supabase/server';
import { Calendar, Video, ArrowRight } from 'lucide-react';
import { EventsList } from './EventsList';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'eventos', locale, { title: 'Eventos & Webinars · NeuroLearn' });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data } = await sb.rpc('nl_events_upcoming', { p_lang: locale });
  const events = (data as never[]) || [];

  return (
    <main className="bg-white min-h-screen">
      <PageHero
        icon={Calendar} badge={t('ev.badge')}
        title={t('ev.h1_pre')}
        titleAccent={t('ev.h1_accent')}
        subtitle={t('ev.hero_desc')}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="t-h2 text-slate-900 mb-8">{t('ev.upcoming_title')}</h2>
        <EventsList events={events} isAuthed={!!user} />
      </section>

      <section className="bg-slate-50 py-20 border-t border-slate-200/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Video className="h-10 w-10 text-indigo-600 mx-auto mb-4" />
          <h2 className="t-h2 text-slate-900">{t('ev.missed_title')}</h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">{t('ev.missed_desc')}</p>
          <Link href={'/recursos' as any} className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-gradient-to-br from-indigo-600 to-violet-600 hover:scale-105 transition-all text-white font-bold rounded-xl shadow-lg">
            {t('ev.library')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

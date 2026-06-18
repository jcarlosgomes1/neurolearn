import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
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
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 border-b border-slate-200/60">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-200 text-xs font-semibold text-indigo-700 mb-6 shadow-sm">
            <Calendar className="h-3.5 w-3.5" /> {t('ev.badge')}
          </div>
          <h1 className="t-h1 text-slate-900">
            {t('ev.h1_pre')}<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{t('ev.h1_accent')}</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">{t('ev.hero_desc')}</p>
        </div>
      </section>

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

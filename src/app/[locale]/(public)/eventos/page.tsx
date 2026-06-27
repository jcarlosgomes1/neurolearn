import { seoMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { createClient } from '@/lib/supabase/server';
import { Calendar } from 'lucide-react';
import { EventsList } from './EventsList';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'eventos', locale, { title: 'Eventos · NeuroLearn' });
}

type Ev = {
  slug: string; title: string; idioma: string;
  event_at: string | null; event_timezone: string | null;
  modalidade: string | null; kind: string | null; room_provider: string | null;
  gravavel: boolean; is_past: boolean; subtitle: string | null;
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data } = await sb.rpc('nl_events_repo_list', { p_limit: 120 });
  const res = (data as { ok?: boolean; events?: Ev[] }) || {};
  const events = res.events || [];

  return (
    <main className="bg-white min-h-screen">
      <PageHero
        icon={Calendar} badge={t('ev.badge')}
        title={t('ev.h1_pre')}
        titleAccent={t('ev.h1_accent')}
        subtitle={t('ev.hero_desc')}
      />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <EventsList events={events} locale={locale} />
      </section>
    </main>
  );
}

import { createClient } from '@/lib/supabase/server';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { EventsRepo } from './EventsRepo';

export const dynamic = 'force-dynamic';

const META: Record<string, { t: string; d: string }> = {
  pt: { t: 'Eventos', d: 'Sessões ao vivo e gravações' },
  en: { t: 'Events', d: 'Live sessions and replays' },
  es: { t: 'Eventos', d: 'Sesiones en directo y grabaciones' },
  fr: { t: 'Événements', d: 'Sessions en direct et rediffusions' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const m = META[locale] || META.pt;
  return { title: m.t, description: m.d };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_events_repo_list', { p_limit: 80 });
  const events = ((data as { events?: unknown })?.events as unknown[]) || [];

  return (
    <SiteChrome locale={locale} mainClassName="min-h-screen bg-slate-50" wrapInner={false}>
      <EventsRepo events={events as never} locale={locale} />
    </SiteChrome>
  );
}

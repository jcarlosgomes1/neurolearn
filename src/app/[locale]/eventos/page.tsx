import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { EventsRepo } from './EventsRepo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  try {
    const t = (await getTranslations({ locale })) as unknown as (k: string) => string;
    return { title: t('events.repo.title'), description: t('events.repo.subtitle') };
  } catch {
    return { title: 'Eventos' };
  }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_events_repo_list', { p_limit: 120 });
  const res = data as { ok?: boolean; events?: unknown[] } | null;
  const events = (res?.events as any[]) || [];

  return (
    <SiteChrome locale={locale} mainClassName="min-h-screen bg-slate-50" wrapInner={false}>
      <EventsRepo events={events} locale={locale} />
    </SiteChrome>
  );
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { MarketingCalendarClient } from './MarketingCalendarClient';

export default async function MarketingCalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { redirect({ href: '/login', locale }); return null; }
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) { redirect({ href: '/learn', locale }); return null; }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { data: events } = await sb.rpc('nl_marketing_calendar_month', { p_year: year, p_month: month });
  const { data: cadence } = await sb.from('nl_marketing_cadence').select('*').eq('enabled', true).order('channel');

  return (
    <MarketingCalendarClient
      initialYear={year}
      initialMonth={month}
      initialEvents={events || []}
      cadence={cadence || []}
    />
  );
}

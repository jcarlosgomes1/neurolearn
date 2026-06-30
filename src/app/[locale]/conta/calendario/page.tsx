import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { CalendarConnectionsClient } from './CalendarConnectionsClient';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { return { title: 'Calendário · NeuroLearn' }; }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { redirect({ href: '/login', locale }); return null; }
  return <CalendarConnectionsClient />;
}

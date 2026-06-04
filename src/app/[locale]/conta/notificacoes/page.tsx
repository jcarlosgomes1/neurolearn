import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { listNotificationsAction } from '../actions';
import { NotificationsListClient } from './NotificationsListClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const r = await listNotificationsAction(false, 100);
  return <NotificationsListClient initial={(r.ok ? r.data : []) as any[]} locale={locale} />;
}

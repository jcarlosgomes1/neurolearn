import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotificacoesClient } from './NotificacoesClient';

export const metadata = { title: 'Notificações · NeuroLearn' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/conta/notificacoes`);
  const { data } = await sb.rpc('nl_notifications_list', { p_limit: 100 });
  return (
    <>
      <NotificacoesClient initial={(data as any[]) || []} />
    </>
  );
}

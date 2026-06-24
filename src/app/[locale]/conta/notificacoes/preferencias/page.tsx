import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from '@/i18n/routing';
import { NotifPrefsClient } from './NotifPrefsClient';
import { Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotifPrefsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  const { data: prefs } = await sb.rpc('nl_my_notif_prefs');
  const whatsappEnabled = (await sb.rpc('nl_platform_config_get', { p_key: 'feature.whatsapp_notifications' })).data === 'true';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader title="Preferências de notificação" description="Escolhe como e quando queres ser notificado. Canais e tipos individuais." />
      <NotifPrefsClient initial={prefs as any} whatsappEnabled={whatsappEnabled} />
    </div>
  );
}

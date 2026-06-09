import { createClient } from '@/lib/supabase/server';
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
    <div className="">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Bell className="h-3.5 w-3.5" /> Notificações
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Preferências de notificação</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Escolhe como e quando queres ser notificado. Canais e tipos individuais.
        </p>
      </div>
      <NotifPrefsClient initial={prefs as any} whatsappEnabled={whatsappEnabled} />
    </div>
  );
}

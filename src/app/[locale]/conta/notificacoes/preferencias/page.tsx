import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from '@/i18n/routing';
import { NotifPrefsClient } from './NotifPrefsClient';
import { Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotifPrefsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  const { data: prefs } = await sb.rpc('nl_my_notif_prefs');
  const whatsappEnabled = (await sb.rpc('nl_platform_config_get', { p_key: 'feature.whatsapp_notifications' })).data === 'true';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader title={safeT('account.notif_prefs.title', 'Preferências de notificação')} description={safeT('account.notif_prefs.description', 'Escolhe como e quando queres ser notificado. Canais e tipos individuais.')} />
      <NotifPrefsClient initial={prefs as any} whatsappEnabled={whatsappEnabled} />
    </div>
  );
}

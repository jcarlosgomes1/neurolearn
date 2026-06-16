import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { TopBarConfigClient } from './TopBarConfigClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/topbar');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect('/');

  const { data } = await sb.rpc('nl_admin_topbar_get');

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <AdminPageHeader
        emoji="🔔"
        eyebrow={safeT('admin.topbar.eyebrow', 'CMS · Top-bar')}
        title={safeT('admin.topbar.title', 'Banner do topo')}
        description={safeT('admin.topbar.description', 'Mensagem temporária que aparece no topo de todas as páginas públicas (lançamentos, promoções, avisos).')}
      />
      <TopBarConfigClient initial={(data as any) || {}} />
    </div>
  );
}

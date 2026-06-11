import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { AffiliatesClient } from './AffiliatesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/affiliates');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect('/');

  const [{ data: list }, { data: kpis }] = await Promise.all([
    sb.rpc('nl_admin_affiliates_list', { p_search: null, p_status: null }),
    sb.rpc('nl_admin_affiliate_kpis'),
  ]);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <AdminPageHeader
        backHref="/admin"
        emoji="🤝"
        eyebrow={safeT('admin.affiliates.eyebrow', 'Administração · Afiliados')}
        title={safeT('admin.affiliates.title', 'Programa de afiliados')}
        description={safeT('admin.affiliates.description', 'Aprova candidaturas, define comissões e acompanha o desempenho.')}
      />
      <AffiliatesClient
        kpis={(kpis as any) || {}}
        initial={Array.isArray(list) ? list : []}
      />
    </div>
  );
}

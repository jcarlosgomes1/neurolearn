import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { UsersClient } from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/users');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect('/');

  const [{ data: initial }, { data: kpis }] = await Promise.all([
    sb.rpc('nl_admin_users_list', { p_search: null, p_role: null, p_is_active: null, p_limit: 50, p_offset: 0 }),
    sb.rpc('nl_admin_users_kpis'),
  ]);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <AdminPageHeader
        emoji="👥"
        eyebrow={safeT('admin.users.eyebrow', 'Administração · Utilizadores')}
        title={safeT('admin.users.title', 'Gestão de utilizadores')}
        description={safeT('admin.users.description', 'Procura, filtra e gere todos os utilizadores da plataforma.')}
      />
      <UsersClient
        currentUserId={user.id}
        kpis={(kpis as any) || {}}
        initialPage={(initial as any) || { items: [], total: 0 }}
      />
    </div>
  );
}

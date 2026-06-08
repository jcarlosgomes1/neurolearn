import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={'/admin' as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Cockpit
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Users className="h-3.5 w-3.5" /> {safeT('admin.users.eyebrow', 'Administração · Utilizadores')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('admin.users.title', 'Gestão de utilizadores')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('admin.users.description', 'Procura, filtra e gere todos os utilizadores da plataforma.')}
        </p>
      </header>
      <UsersClient
        currentUserId={user.id}
        kpis={(kpis as any) || {}}
        initialPage={(initial as any) || { items: [], total: 0 }}
      />
    </div>
  );
}

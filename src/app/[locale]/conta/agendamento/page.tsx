import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { SchedulingDashboard } from './SchedulingDashboard';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { redirect({ href: '/login', locale }); return null; }

  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  const role = profile?.role || 'student';
  if (!['instructor', 'admin', 'super_admin', 'account_manager'].includes(role)) {
    redirect({ href: '/conta', locale });
    return null;
  }

  const { data: dash } = await sb.rpc('nl_scheduling_my_dashboard');

  return <SchedulingDashboard initial={dash || null} />;
}

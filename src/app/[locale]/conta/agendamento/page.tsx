import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { SchedulingDashboard } from './SchedulingDashboard';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { redirect({ href: '/login', locale }); return null; }

  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  const role = profile?.role || 'student';
  if (!['instructor','admin','super_admin','account_manager'].includes(role)) {
    redirect({ href: '/conta', locale });
    return null;
  }
  const area: 'admin' | 'instructor' | 'student' =
    role === 'admin' || role === 'super_admin' ? 'admin' :
    role === 'instructor' ? 'instructor' : 'student';

  const t = await getTranslations();
  const { data: dash } = await sb.rpc('nl_scheduling_my_dashboard');

  return (
    <AppShell role={area} pageTitle={t('sched.dashboard.title')}>
      <SchedulingDashboard initial={dash || null} />
    </AppShell>
  );
}

import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';

export default async function ContaLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  const role: 'admin' | 'instructor' | 'student' =
    (profile?.role === 'admin' || profile?.role === 'super_admin') ? 'admin'
    : profile?.role === 'instructor' ? 'instructor' : 'student';
  return (
    <AppShell role={role}>
      {children}
    </AppShell>
  );
}

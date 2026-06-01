import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';

export default async function TeachLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user!.id).single();
  if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) redirect({ href: '/', locale });
  return (
    <AppShell role={['admin','super_admin'].includes(profile.role) ? 'admin' : 'instructor'}>
      {children}
    </AppShell>
  );
}

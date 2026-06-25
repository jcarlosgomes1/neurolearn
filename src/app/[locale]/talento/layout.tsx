import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';

export default async function TalentoLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  return (
    <AppShell role="student">
      {children}
    </AppShell>
  );
}

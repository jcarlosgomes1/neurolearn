import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { AccountClient } from './AccountClient';

export default async function ContaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { redirect({ href: '/login', locale }); return null; }

  // Determinar área para o AppShell (admin / instructor / student)
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  const role = profile?.role || 'student';
  const area: 'admin' | 'instructor' | 'student' =
    role === 'admin' || role === 'super_admin' ? 'admin' :
    role === 'instructor' ? 'instructor' : 'student';

  const t = await getTranslations();

  // Pre-fetch account data server-side (mais rápido)
  const { data: account } = await sb.rpc('nl_my_account');

  return (
    <AppShell role={area} pageTitle={t('account.title')}>
      <AccountClient initialData={account || null} initialLocale={locale} />
    </AppShell>
  );
}

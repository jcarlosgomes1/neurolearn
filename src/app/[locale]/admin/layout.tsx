import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { TwoFactorBanner } from '@/components/security/TwoFactorBanner';

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });

  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user!.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect({ href: '/', locale });

  // 2FA check: detectar se admin tem factor verificado
  const { data: factors } = await sb.auth.mfa.listFactors();
  const hasMfa = (factors?.totp || []).some((f: any) => f.status === 'verified');

  return (
    <AppShell role="admin">
      {!hasMfa && <TwoFactorBanner role={profile.role} />}
      {children}
    </AppShell>
  );
}

import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { TwoFactorBanner } from '@/components/security/TwoFactorBanner';
import { PageTips } from '@/components/admin/PageTips';

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user }, error: userErr } = await sb.auth.getUser();

  if (userErr || !user) {
    console.log('[admin/layout] no user:', { userErr: userErr?.message });
    redirect({ href: '/login', locale });
  }

  const { data: profile, error: profileErr } = await sb
    .from('nl_profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profileErr) {
    console.error('[admin/layout] profile read error', {
      userId: user!.id, error: profileErr.message, code: profileErr.code,
    });
  }
  if (!profile) {
    console.error('[admin/layout] profile NOT FOUND', { userId: user!.id, email: user!.email });
  }
  if (profile && !['admin', 'super_admin'].includes(profile.role)) {
    console.warn('[admin/layout] non-admin role', { userId: user!.id, role: profile.role });
  }

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect({ href: '/', locale });
  }

  const safeRole: string = profile!.role;

  let hasMfa = false;
  try {
    const { data: factors } = await sb.auth.mfa.listFactors();
    hasMfa = (factors?.totp || []).some((f: any) => f.status === 'verified');
  } catch { hasMfa = false; }

  return (
    <AppShell role="admin">
      {!hasMfa && <TwoFactorBanner role={safeRole} />}
      {children}
      <PageTips />
    </AppShell>
  );
}

import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { AuthConfigClient } from './AuthConfigClient';

export const metadata = { title: 'Authentication & Security' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/admin/autenticacao`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);

  // Check if SUPABASE_MANAGEMENT_TOKEN is configured
  const { data: tokenRow } = await sb.from('nl_secrets').select('value').eq('key', 'SUPABASE_MANAGEMENT_TOKEN').maybeSingle();
  const tokenConfigured = !!tokenRow?.value;

  const supabaseCallbackUrl = 'https://obpezocujzdaznrdgwoo.supabase.co/auth/v1/callback';

  return (
    <AppShell role="admin" pageTitle={t('admin.auth.title')}>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{t('admin.auth.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('admin.auth.subtitle')}</p>
        </div>

        {!tokenConfigured ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">{t('admin.auth.missing_token')}</h3>
                <ol className="mt-3 text-sm text-amber-800 space-y-1 list-decimal list-inside">
                  <li>Vai a <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener" className="underline font-medium">supabase.com/dashboard/account/tokens</a></li>
                  <li>Generate new token → nome &quot;NeuroLearn Management&quot;</li>
                  <li>Copia (começa com <code>sbp_...</code>)</li>
                  <li>Cola em <a href={`/${locale}/admin/integracoes`} className="underline font-medium">/admin/integracoes</a> na chave <code>SUPABASE_MANAGEMENT_TOKEN</code></li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <AuthConfigClient locale={locale} supabaseCallbackUrl={supabaseCallbackUrl} />
        )}
      </div>
    </AppShell>
  );
}

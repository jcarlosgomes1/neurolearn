import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';

export const metadata = { title: 'Invitation' };

export default async function Page({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  // Buscar convite
  const { data: inv } = await sb.from('nl_org_invitations')
    .select('id, email, role, expires_at, accepted_at, org_id')
    .eq('token', token)
    .maybeSingle();

  if (!inv || inv.accepted_at || new Date(inv.expires_at) < new Date()) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-xl font-bold text-slate-900">{t('invite.expired')}</h1>
            <Link href={`/${locale}` as any} className="mt-6 inline-block text-sm text-brand-600 hover:underline">← {t('nav.home')}</Link>
          </div>
        </main>
      </>
    );
  }

  // Fetch org info
  const { data: org } = await sb.from('nl_organizations')
    .select('id, name, slug, logo_url, primary_color')
    .eq('id', inv.org_id).single();

  if (!user) {
    // Não autenticado — força login e volta
    redirect(`/${locale}/login?next=/${locale}/convite/${token}`);
  }

  // Auto-aceitar via RPC
  const { data: result, error } = await sb.rpc('nl_org_accept_invitation', { p_token: token });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          {error || !result?.ok ? (
            <>
              <div className="text-5xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-slate-900">{t('invite.expired')}</h1>
              <p className="mt-2 text-sm text-slate-500">{error?.message || result?.error || ''}</p>
            </>
          ) : (
            <>
              {org?.logo_url ? (
                <img src={org.logo_url} alt={org?.name || ''} className="h-14 mx-auto mb-4 rounded-xl" />
              ) : (
                <div className="text-5xl mb-4">🎉</div>
              )}
              <h1 className="text-xl font-bold text-slate-900">{t('invite.success')}</h1>
              <p className="mt-2 text-sm text-slate-600">{org?.name}</p>
              <p className="mt-1 text-xs text-slate-400 uppercase tracking-wider">{t(('invite.role.' + inv.role) as any)}</p>
              <Link href={`/${locale}/empresa/${org?.slug}` as any}
                className="mt-6 inline-block px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white text-sm font-semibold">
                {org?.name} →
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}

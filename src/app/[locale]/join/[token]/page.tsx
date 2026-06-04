import { redirect } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { AcceptInviteClient } from './AcceptInviteClient';
import { getTranslations } from 'next-intl/server';

export const metadata = { title: 'Join workspace' };

export default async function Page({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  // Fetch invitation info publicly via service role table query (safer: use a RPC)
  const { data: inv } = await sb
    .from('nl_org_invitations')
    .select('id, email, role, org_id, expires_at, accepted_at')
    .eq('token', token)
    .maybeSingle();

  let orgName: string | null = null;
  if (inv?.org_id) {
    const { data: o } = await sb.from('nl_organizations').select('name').eq('id', inv.org_id).maybeSingle();
    orgName = (o as any)?.name || null;
  }

  const t = await getTranslations();
  const invalid = !inv || !!inv.accepted_at || (inv.expires_at && new Date(inv.expires_at) < new Date());

  if (!user) {
    redirect({ href: `/login?next=/join/${token}` as any, locale });
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {invalid ? (
            <div className="bg-white rounded-2xl shadow-sm border border-rose-200 p-6 text-center">
              <div className="text-rose-600 font-semibold">{t('emp.join.invalid')}</div>
            </div>
          ) : (
            <AcceptInviteClient token={token} orgName={orgName || ''} role={inv!.role} />
          )}
        </div>
      </main>
    </>
  );
}

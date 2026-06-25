import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { SuccessClient } from './SuccessClient';
import { SiteChrome } from '@/components/layout/SiteChrome';

export default async function Page({ params, searchParams }: { params: Promise<{ token: string; locale: string }>; searchParams: Promise<{ paid?: string; pay?: string; cancelled_payment?: string }> }) {
  const { token, locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: res } = await sb.rpc('nl_scheduling_booking_by_token', { p_token: token });

  if (!res?.ok) {
    return (
      <SiteChrome locale={locale} mainClassName="min-h-screen bg-white" innerClassName="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">404</h1>
        <p className="mt-3 text-slate-600">{t('sched.public.not_found')}</p>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome locale={locale} mainClassName="min-h-screen bg-slate-50" wrapInner={false}>
      <SuccessClient booking={res.booking} token={token} initialAction={sp.pay === '1' ? 'pay' : sp.paid === '1' ? 'paid_redirect' : null} />
    </SiteChrome>
  );
}

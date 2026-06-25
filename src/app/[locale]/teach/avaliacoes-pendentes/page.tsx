import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { EvaluationsClient } from './EvaluationsClient';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

export const dynamic = 'force-dynamic';

export default async function PendingEvaluationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  const { data: pending } = await sb.rpc('nl_my_pending_evaluations');

  return (
    <div className="">
      <AppPageHeader  title={t('tea.eval_h1')} description={t('tea.eval_intro')} />
      <EvaluationsClient items={Array.isArray(pending) ? pending : []} />
    </div>
  );
}

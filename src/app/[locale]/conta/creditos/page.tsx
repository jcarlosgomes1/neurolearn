import { createClient } from '@/lib/supabase/server';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { CreditsClient } from './CreditsClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login?redirect_to=/conta/creditos');
  const t = await getTranslations();

  const [{ data: balance }, { data: history }] = await Promise.all([
    sb.rpc('nl_credits_balance', { p_user: user.id }),
    sb.rpc('nl_credits_my_history', { p_limit: 50 }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <AppPageHeader
        emoji="🪙"
        eyebrow={t('credits.eyebrow')}
        title={t('credits.title')}
        description={t('credits.desc')}
      />
      <CreditsClient
        balance={typeof balance === 'number' ? balance : 0}
        history={Array.isArray(history) ? history : []}
      />
    </div>
  );
}

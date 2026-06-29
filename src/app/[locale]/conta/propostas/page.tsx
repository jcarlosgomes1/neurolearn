import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { ProposalsClient } from './ProposalsClient';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { return { title: 'Propostas de reunião · NeuroLearn' }; }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { redirect({ href: '/login', locale }); return null; }

  const { data } = await sb.rpc('nl_meeting_proposals_for_me');
  return <ProposalsClient initial={data || null} />;
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGdprRequestsAction } from '../actions';
import { PrivacyClient } from './PrivacyClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  
  const r = await getGdprRequestsAction();
  return <PrivacyClient initial={(r.ok ? r.data : []) as any[]} userEmail={user.email || ''} />;
}

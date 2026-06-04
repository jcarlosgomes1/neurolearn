import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TalentProfileClient } from './TalentProfileClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/talento`);
  const { data } = await sb.rpc('nl_talent_profile_get_own');
  return <TalentProfileClient initial={data as any} />;
}

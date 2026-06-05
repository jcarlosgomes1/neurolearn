import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listAddonsAdminAction } from '../monetizacao/actions';
import { AddonsClient } from './AddonsClient';

export const metadata = { title: 'Add-ons · Admin' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);
  const r: any = await listAddonsAdminAction();
  return <AddonsClient initial={(r?.ok && Array.isArray(r.addons)) ? r.addons : []} />;
}

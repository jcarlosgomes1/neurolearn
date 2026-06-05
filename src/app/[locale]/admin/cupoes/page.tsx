import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listCouponsAction } from '../monetizacao/actions';
import { CupoesClient } from './CupoesClient';

export const metadata = { title: 'Cupões · Admin' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);
  const r = await listCouponsAction();
  return <CupoesClient initial={r.ok ? r.coupons : []} />;
}

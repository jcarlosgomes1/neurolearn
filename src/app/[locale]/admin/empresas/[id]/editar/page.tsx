import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrgDetailsAction } from '../../actions';
import { EditOrgClient } from './EditOrgClient';

export const metadata = { title: 'Editar Empresa · Admin' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);
  
  const r = await getOrgDetailsAction(id);
  if (!r.ok) notFound();
  
  return <EditOrgClient orgId={id} org={r.org} features={r.features} />;
}

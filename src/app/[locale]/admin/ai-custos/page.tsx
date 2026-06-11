import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AiCostClient } from './AiCostClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/ai-custos');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) redirect('/');

  return (
    <>
      <AdminPageHeader emoji="💸" title="Custos de IA" subtitle="Gasto agregado de todas as chamadas de IA (via gateway), por operação, modelo e dia." />
      <AiCostClient />
    </>
  );
}

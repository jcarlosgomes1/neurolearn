import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { BacklogKanban } from './BacklogKanban';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/backlog');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) redirect('/');

  return (
    <>
      <AdminPageHeader emoji="🗂️" title="Backlog" subtitle="Mantido automaticamente. A tua única ação: marcar Testado nos itens concluídos que já verificaste." />
      <BacklogKanban />
    </>
  );
}

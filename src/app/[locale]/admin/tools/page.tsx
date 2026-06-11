import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ToolsClient } from './ToolsClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/tools');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) redirect('/');

  const { data: items } = await sb
    .from('nl_nav_items')
    .select('href,i18n_key,icon,group_key')
    .eq('location', 'sidebar_admin')
    .eq('enabled', true)
    .order('sort_order', { ascending: true });

  return (
    <>
      <AdminPageHeader backHref="/admin" emoji="🧭" title="Todas as ferramentas" description="Tudo o que existe no admin, num só sítio. Pesquisa por nome ou secção." />
      <ToolsClient items={(items ?? []) as never} />
    </>
  );
}

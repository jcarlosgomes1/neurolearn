import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { BacklogKanban } from './BacklogKanban';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/backlog');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) redirect('/');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href={'/admin' as any} className="text-sm text-slate-500 hover:text-slate-700">&larr; Admin</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-1">Backlog</h1>
        <p className="text-sm text-slate-500 mb-6">Mantido automaticamente. A tua única ação: marcar <b>Testado</b> nos itens concluídos que já verificaste.</p>
        <BacklogKanban />
      </div>
    </div>
  );
}

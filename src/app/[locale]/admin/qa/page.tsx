import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { QaModerationClient } from './QaModerationClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/qa');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) redirect('/');
  const { data: en } = await sb.rpc('nl_is_feature_enabled', { p_key: 'qa' });
  if (en === false) redirect('/admin');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href={'/admin' as any} className="text-sm text-slate-500 hover:text-slate-700">&larr; Admin</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-1">Moderacao de Perguntas &amp; Respostas</h1>
        <p className="text-sm text-slate-500 mb-6">Itens sinalizados: reportados por utilizadores, auto-sinalizados pela IA, ou marcados manualmente.</p>
        <QaModerationClient />
      </div>
    </div>
  );
}

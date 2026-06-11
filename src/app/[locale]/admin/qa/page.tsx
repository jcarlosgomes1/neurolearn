import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
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
        <AdminPageHeader backHref="/admin" emoji="💬" title="Moderação de Perguntas & Respostas" description="Itens sinalizados: reportados por utilizadores, auto-sinalizados pela IA, ou marcados manualmente." />
        <QaModerationClient />
      </div>
    </div>
  );
}

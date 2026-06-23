import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { CursosTodosClient } from './CursosTodosClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/cursos-todos');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) redirect('/');

  const { data: rows } = await sb.rpc('nl_admin_all_courses');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="👁️" title="Todos os cursos" description="Todos os cursos da plataforma e de tenants. Acesso de superadmin — vês tudo por defeito." />
      <CursosTodosClient rows={(rows ?? []) as never} />
    </div>
  );
}

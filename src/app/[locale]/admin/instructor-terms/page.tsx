import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from 'next/navigation';
import { ClausesClient } from './ClausesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/instructor-terms');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  return (
    <div>
      <AdminPageHeader
        backHref="/admin"
        emoji="📜"
        eyebrow="Pessoas · Contratação"
        title="Termos do instrutor"
        description="Cláusulas contratuais para instrutores aprovados. Texto editável; aplica-se na candidatura e por curso (com toggles por curso)."
        iconGradient="from-violet-500 to-indigo-600"
      />
      <ClausesClient />
    </div>
  );
}

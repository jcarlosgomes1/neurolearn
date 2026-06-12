import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from 'next/navigation';
import { GovernanceClient } from './GovernanceClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/course-pricing');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  return (
    <div>
      <AdminPageHeader
        backHref="/admin"
        emoji="💶"
        eyebrow="Pessoas · Aprovação"
        title="Curadoria & preço"
        description="Vê o nível de curadoria do curso e decide o preço final. O instrutor propõe; a plataforma tem a palavra final."
        iconGradient="from-emerald-500 to-teal-600"
      />
      <GovernanceClient />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { FeaturesClient } from './FeaturesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/features');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data } = await sb
    .from('nl_feature_flags')
    .select('key, label, description, category, enabled, route, sort_order')
    .order('sort_order');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🎚️"
        eyebrow="Sistema · Funcionalidades"
        title="Funcionalidades"
        description="Ativa ou desativa funcionalidades da plataforma em runtime. As alterações aplicam-se em segundos, sem deploy."
      />
      <FeaturesClient initial={Array.isArray(data) ? data : []} />
    </div>
  );
}

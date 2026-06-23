import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { PlatformConfigClient } from './PlatformConfigClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/platform-config');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect('/');

  const { data, error } = await sb.from('nl_platform_config').select('key, value, description').order('key');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="⚙️"
        eyebrow="Sistema · Configuração da plataforma"
        title="Configuração da plataforma"
        description="Variáveis editáveis em runtime: email de contacto, dados empresa, moedas suportadas, e outras chaves de sistema."
      />
      <PlatformConfigClient initial={Array.isArray(data) ? data : []} />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { SsoClient } from './SsoClient';

export const dynamic = 'force-dynamic';

export default async function AdminSsoPage() {
  const sb = await createClient();
  const [{ data: configs }, { data: orgs }] = await Promise.all([
    sb.rpc('nl_admin_sso_configs_list'),
    sb.from('nl_organizations').select('id, name, slug').order('name'),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🔐"
        eyebrow="Enterprise · Single Sign-On"
        title="Configurações SSO"
        description="Configura SAML 2.0 ou OIDC por organização para login federado, com enforce opcional e mapping de atributos."
      />

      <SsoClient configs={Array.isArray(configs) ? configs : []} orgs={Array.isArray(orgs) ? orgs : []} />
    </div>
  );
}

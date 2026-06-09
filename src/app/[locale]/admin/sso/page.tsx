import { createClient } from '@/lib/supabase/server';
import { SsoClient } from './SsoClient';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSsoPage() {
  const sb = await createClient();
  const [{ data: configs }, { data: orgs }] = await Promise.all([
    sb.rpc('nl_admin_sso_configs_list'),
    sb.from('nl_organizations').select('id, name, slug').order('name'),
  ]);

  return (
    <div className="">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Enterprise · Single Sign-On
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações SSO</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Configura SAML 2.0 ou OIDC por organização para login federado, com enforce opcional e mapping de atributos.
        </p>
      </div>

      <SsoClient configs={Array.isArray(configs) ? configs : []} orgs={Array.isArray(orgs) ? orgs : []} />
    </div>
  );
}

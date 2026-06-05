import { SSOConfigsClient } from './SSOConfigsClient';

export const dynamic = 'force-dynamic';

export default function AdminSSOPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SSO Configurations</h1>
        <p className="text-sm text-slate-500 mt-1">SAML 2.0 e OIDC para login empresarial. Configura por organização.</p>
      </div>
      <SSOConfigsClient />
    </div>
  );
}

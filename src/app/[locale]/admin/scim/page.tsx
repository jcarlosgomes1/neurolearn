import { SCIMTokensClient } from './SCIMTokensClient';

export const dynamic = 'force-dynamic';

export default function AdminSCIMPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SCIM Tokens</h1>
        <p className="text-sm text-slate-500 mt-1">User provisioning automático para organizações via SCIM 2.0. Os tokens só são mostrados uma vez na criação.</p>
      </div>
      <SCIMTokensClient />
    </div>
  );
}

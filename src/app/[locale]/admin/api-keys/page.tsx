import { ApiKeysClient } from './ApiKeysClient';

export const dynamic = 'force-dynamic';

export default function AdminApiKeysPage() {
  return (
    <div className="">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
        <p className="text-sm text-slate-500 mt-1">Gere chaves de API com scopes e revogação. As chaves só são mostradas uma vez na criação.</p>
      </div>
      <ApiKeysClient />
    </div>
  );
}

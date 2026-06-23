import { ApiKeysClient } from './ApiKeysClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function AdminApiKeysPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="🔑" title="API Keys" description="Gere chaves de API com scopes e revogação. As chaves só são mostradas uma vez na criação." />
      <ApiKeysClient />
    </div>
  );
}

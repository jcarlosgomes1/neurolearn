import { ApiKeysClient } from './ApiKeysClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function AdminApiKeysPage() {
  return (
    <div className="">
      <AdminPageHeader backHref="/admin" emoji="🔑" title="API Keys" description="Gere chaves de API com scopes e revogação. As chaves só são mostradas uma vez na criação." />
      <ApiKeysClient />
    </div>
  );
}

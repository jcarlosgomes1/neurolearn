import { Suspense } from 'react';
import { AuditLogsClient } from './AuditLogsClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="📜" title="Audit logs" description="Histórico de acções da plataforma. Filtra por actor, action ou recurso." />
      <Suspense fallback={<div className="text-slate-400 text-sm">A carregar...</div>}>
        <AuditLogsClient />
      </Suspense>
    </div>
  );
}

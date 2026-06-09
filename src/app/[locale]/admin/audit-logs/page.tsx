import { Suspense } from 'react';
import { AuditLogsClient } from './AuditLogsClient';

export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  return (
    <div className="">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit logs</h1>
        <p className="text-sm text-slate-500 mt-1">Histórico de acções da plataforma. Filtra por actor, action ou recurso.</p>
      </div>
      <Suspense fallback={<div className="text-slate-400 text-sm">A carregar...</div>}>
        <AuditLogsClient />
      </Suspense>
    </div>
  );
}

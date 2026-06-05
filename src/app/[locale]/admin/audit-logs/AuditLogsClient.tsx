'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Filter, RefreshCw, Eye, Shield, AlertCircle } from 'lucide-react';
import { Skeleton, SkeletonTable } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export function AuditLogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [since, setSince] = useState('');
  const [_, startTransition] = useTransition();
  const [detail, setDetail] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_audit_logs_list', {
        p_actor: actor || null,
        p_action: action || null,
        p_resource: resource || null,
        p_since: since ? new Date(since).toISOString() : null,
        p_limit: 200,
        p_offset: 0,
      });
      if (!error && Array.isArray(data)) setLogs(data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function reload() { startTransition(load); }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900 text-sm">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Actor (email)"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Action"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
          <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="Resource"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
          <input type="datetime-local" value={since} onChange={(e) => setSince(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
          <button onClick={reload}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium">
            <RefreshCw className="h-4 w-4" /> Aplicar
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : logs.length === 0 ? (
        <EmptyState icon={<Shield className="h-6 w-6" />} title="Sem logs"
          description="Não foram encontrados logs com estes filtros." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left">Quando</th>
                <th className="px-3 py-2.5 text-left">Actor</th>
                <th className="px-3 py-2.5 text-left">Action</th>
                <th className="px-3 py-2.5 text-left">Resource</th>
                <th className="px-3 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-slate-500 text-xs">{new Date(l.created_at).toLocaleString('pt-PT')}</td>
                  <td className="px-3 py-2.5 text-slate-700 truncate max-w-[200px]">{l.actor_email || <span className="text-slate-400">sistema</span>}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">{l.action}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    {l.resource}{l.resource_id ? <span className="text-slate-400">#{String(l.resource_id).slice(0, 8)}</span> : ''}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => setDetail(l)}
                      className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Detalhe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalhe */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Detalhe do log</h3>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm mb-3">
              <dt className="text-slate-500">ID</dt><dd className="col-span-2 font-mono text-xs">{detail.id}</dd>
              <dt className="text-slate-500">Quando</dt><dd className="col-span-2">{new Date(detail.created_at).toLocaleString('pt-PT')}</dd>
              <dt className="text-slate-500">Actor</dt><dd className="col-span-2">{detail.actor_email || 'sistema'}</dd>
              <dt className="text-slate-500">Action</dt><dd className="col-span-2 font-mono">{detail.action}</dd>
              <dt className="text-slate-500">Resource</dt><dd className="col-span-2">{detail.resource}{detail.resource_id ? ` #${detail.resource_id}` : ''}</dd>
              {detail.ip_address && <><dt className="text-slate-500">IP</dt><dd className="col-span-2 font-mono text-xs">{detail.ip_address}</dd></>}
              {detail.user_agent && <><dt className="text-slate-500">UA</dt><dd className="col-span-2 text-xs truncate">{detail.user_agent}</dd></>}
            </dl>
            {detail.metadata && Object.keys(detail.metadata).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-1">Metadata</h4>
                <pre className="bg-slate-50 p-3 rounded-lg text-xs overflow-x-auto">{JSON.stringify(detail.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

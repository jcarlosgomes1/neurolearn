'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents } from '@/lib/utils/cn';

export function AdminInstructors() {
  const [list, setList] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    callAgentOps<{ instructors: any[] }>('admin_list_instructors')
      .then((r) => setList(r.instructors))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err === 'admin_required' || err === 'unauthorized' ? 'Acesso restrito a administradores.' : err === 'not_authenticated' ? 'Inicia sessão primeiro.' : err}</p>
        <Link href={'/login' as any} className="btn-primary mt-6 inline-flex">Entrar</Link>
      </div>
    );
  }
  if (!list) return <DashboardSkeleton stats={4} />;

  const statusColor = (s: string) => s === 'approved' ? 'bg-emerald-100 text-emerald-700' : s === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Instrutores</h1>
          <p className="text-slate-500 text-sm">{list.length} instrutores registados</p>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Sem instrutores ainda.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Instrutor</th>
                  <th className="text-left font-medium px-4 py-3">Estado</th>
                  <th className="text-right font-medium px-4 py-3">Alunos</th>
                  <th className="text-right font-medium px-4 py-3">Receita</th>
                  <th className="text-right font-medium px-4 py-3">Rating</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(i.avatar_url || i.profile_picture_url) ? (
                          <img src={i.avatar_url || i.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">{(i.display_name || '?')[0]?.toUpperCase()}</div>
                        )}
                        <span className="font-medium text-slate-900">{i.display_name || 'Sem nome'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(i.status)}`}>{i.status}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums">{i.total_students || 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtCents(i.total_revenue_cents)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{i.rating_avg ? `★ ${Number(i.rating_avg).toFixed(1)}` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/instrutor/${i.id}` as any} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700">Ver painel</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { Search, Building2, Globe, Pencil } from 'lucide-react';

interface Row {
  id: string; title: string; emoji: string | null; published: boolean;
  approval_status: string | null; archived: boolean; org_id: string | null;
  org_name: string | null; instructor_name: string | null;
  enrollments_count: number | null; course_type: string | null;
  visibility: string | null; created_at: string;
}

export function CursosTodosClient({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<'all' | 'platform' | 'tenant'>('all');

  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => rows.filter((r) => {
    if (scope === 'platform' && r.org_id) return false;
    if (scope === 'tenant' && !r.org_id) return false;
    if (!term) return true;
    return (r.title?.toLowerCase().includes(term)
      || (r.org_name ?? '').toLowerCase().includes(term)
      || (r.instructor_name ?? '').toLowerCase().includes(term)
      || r.id.toLowerCase().includes(term));
  }), [rows, term, scope]);

  const counts = useMemo(() => ({
    all: rows.length,
    platform: rows.filter((r) => !r.org_id).length,
    tenant: rows.filter((r) => r.org_id).length,
  }), [rows]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por título, tenant, instrutor…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-violet-400 shadow-sm" />
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-sm">
          {([['all', 'Todos'], ['platform', 'Plataforma'], ['tenant', 'Tenants']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setScope(k)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${scope === k ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label} <span className={scope === k ? 'opacity-80' : 'text-slate-400'}>{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-sm text-slate-400">Sem cursos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="group bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xl flex-shrink-0">
                {r.emoji || '📘'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{r.title || r.id}</h3>
                  {r.org_id ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                      <Building2 className="h-3 w-3" /> {r.org_name || 'Tenant'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                      <Globe className="h-3 w-3" /> Plataforma
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {r.instructor_name || '—'} · {r.published ? 'Publicado' : 'Rascunho'}{r.approval_status ? ` · ${r.approval_status}` : ''}{r.archived ? ' · Arquivado' : ''}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link href={`/admin/curso/${r.id}/editar` as any}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                    <Pencil className="h-3 w-3" /> Abrir
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

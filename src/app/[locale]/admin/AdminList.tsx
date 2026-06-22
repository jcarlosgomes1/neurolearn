'use client';

import { useEffect, useState, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents, relTime } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import { Loader2, Search, Filter, ChevronRight, AlertCircle, Database } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface Column { key: string; label: string; primary?: boolean; kind?: 'cents' | 'rating' | 'badge' | 'reltime' }

interface Props {
  title: string;
  action: string;
  dataKey: string;
  backHref?: string;
  columns: Column[];
  linkPrefix?: string;
  linkSuffix?: string;
  linkKey?: string;
  linkLabel?: string;
  // New optional props for premium look
  eyebrow?: string;
  description?: string;
  accentGradient?: string;
  icon?: any;
}

const BADGE_STYLES: Record<string, string> = {
  active:     'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  completed:  'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  succeeded:  'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  approved:   'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  pending:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  running:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  processing: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  queued:     'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  failed:     'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  rejected:   'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  cancelled:  'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  inactive:   'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
};

function renderCell(row: any, col: Column) {
  const v = row[col.key];
  if (v === null || v === undefined || v === '') return <span className="text-slate-300">—</span>;
  if (col.kind === 'cents') return <span className="font-semibold tabular-nums">{fmtCents(v)}</span>;
  if (col.kind === 'rating') return <span className="text-amber-600 font-semibold">★ {Number(v).toFixed(1)}</span>;
  if (col.kind === 'reltime') return <span className="text-slate-500 text-[11px]">{relTime(v)}</span>;
  if (col.kind === 'badge') {
    const lc = String(v).toLowerCase();
    const cls = BADGE_STYLES[lc] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    return <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${cls}`}>{v}</span>;
  }
  return String(v);
}

export function AdminList({
  title, action, dataKey, backHref, columns,
  linkPrefix, linkSuffix, linkKey, linkLabel,
  eyebrow, description, accentGradient = 'from-violet-600 to-indigo-600', icon: Icon = Database,
}: Props) {
  const t = useTranslations();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    callAgentOps<any>(action).then((r) => setRows(r[dataKey] || [])).catch((e) => setErr(e.message));
  }, [action, dataKey]);

  const filtered = useMemo(() => {
    if (!rows || !search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((c) => String(row[c.key] ?? '').toLowerCase().includes(q))
    );
  }, [rows, search, columns]);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  // Error state — premium
  if (err) {
    const isAuth = err === 'admin_required' || err === 'unauthorized' || err === 'not_authenticated';
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="font-bold text-slate-900 mb-1">
            {isAuth ? safeT('acom.access_restricted', 'Acesso restrito') : 'Erro'}
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            {err === 'admin_required' || err === 'unauthorized' ? safeT('acom.access_restricted', 'Sem permissões') :
             err === 'not_authenticated' ? safeT('acom.signin_first', 'Inicia sessão primeiro') : err}
          </p>
          <Link href={'/login' as any}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
            {safeT('acom.btn_signin', 'Entrar')}
          </Link>
        </div>
      </div>
    );
  }

  // Loading state — premium
  if (!rows) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-10 w-64 bg-slate-200 rounded" />
          <div className="h-12 bg-white border border-slate-200 rounded-xl" />
          <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        backHref={backHref}
        icon={Icon}
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br ${accentGradient} text-white rounded-xl shadow-sm`}>
            <Icon className="h-4 w-4" />
            <div>
              <div className="text-2xl font-bold leading-none">{(filtered ?? rows).length}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">{safeT('acom.records', 'registos')}</div>
            </div>
          </div>
        }
      />

      {/* Search bar */}
      {rows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
          </div>
          {search && (
            <span className="text-xs text-slate-500 px-2">
              {(filtered ?? []).length} / {rows.length}
            </span>
          )}
        </div>
      )}

      {/* Empty / List */}
      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">{safeT('acom.no_records', 'Sem registos.')}</p>
        </div>
      ) : (filtered ?? rows).length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-500">Sem resultados para "<span className="font-semibold">{search}</span>".</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-slate-600 text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="text-left font-bold px-4 py-3">{c.label}</th>
                  ))}
                  {linkPrefix && <th className="px-4 py-3 w-12"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filtered ?? rows).map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-violet-50/30 transition-colors group">
                    {columns.map((c) => (
                      <td key={c.key} className={`px-4 py-3 ${c.primary ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {renderCell(row, c)}
                      </td>
                    ))}
                    {linkPrefix && linkKey && (
                      <td className="px-4 py-3 text-right">
                        <Link href={`${linkPrefix}${row[linkKey]}${linkSuffix || ''}` as any}
                          className={`inline-flex items-center gap-1 text-xs bg-gradient-to-br ${accentGradient} hover:opacity-90 text-white px-3 py-1.5 rounded-lg font-semibold shadow-sm transition-all group-hover:gap-1.5`}>
                          {linkLabel || safeT('acom.btn_open', 'Abrir')}
                          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </td>
                    )}
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

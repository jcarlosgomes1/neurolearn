'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents, relTime } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';

interface Column { key: string; label: string; primary?: boolean; kind?: 'cents' | 'rating' | 'badge' | 'reltime' }

interface Props {
  title: string;
  action: string;
  dataKey: string;
  backHref: string;
  columns: Column[];
  linkPrefix?: string;
  linkSuffix?: string;
  linkKey?: string;
  linkLabel?: string;
}

function renderCell(row: any, col: Column) {
  const v = row[col.key];
  if (v === null || v === undefined || v === '') return '—';
  if (col.kind === 'cents') return fmtCents(v);
  if (col.kind === 'rating') return `★ ${Number(v).toFixed(1)}`;
  if (col.kind === 'reltime') return relTime(v);
  if (col.kind === 'badge') {
    const color = v === 'active' || v === 'completed' || v === 'succeeded' ? 'bg-emerald-100 text-emerald-700' : v === 'pending' || v === 'running' ? 'bg-amber-100 text-amber-700' : v === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600';
    return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{v}</span>;
  }
  return String(v);
}

export function AdminList({ title, action, dataKey, backHref, columns, linkPrefix, linkSuffix, linkKey, linkLabel }: Props) {
  const t = useTranslations();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    callAgentOps<any>(action).then((r) => setRows(r[dataKey] || [])).catch((e) => setErr(e.message));
  }, [action, dataKey]);

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err === 'admin_required' || err === 'unauthorized' ? t('acom.access_restricted') : err === 'not_authenticated' ? t('acom.signin_first') : err}</p>
        <Link href={'/login' as any} className="btn-primary mt-6 inline-flex">{t('acom.btn_signin')}</Link>
      </div>
    );
  }
  if (!rows) return <DashboardSkeleton stats={3} />;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <Link href={backHref as any} className="text-sm text-brand-600 hover:underline">{t('acom.back_cockpit')}</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{title}</h1>
        <p className="text-slate-500 text-sm">{t('acom.records_count', { n: rows.length })}</p>
      </div>
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">{t('acom.no_records')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>{columns.map((c) => <th key={c.key} className="text-left font-medium px-4 py-3">{c.label}</th>)}{linkPrefix && <th className="px-4 py-3"></th>}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-slate-50">
                    {columns.map((c) => <td key={c.key} className={`px-4 py-3 ${c.primary ? 'font-medium text-slate-900' : 'text-slate-600'}`}>{renderCell(row, c)}</td>)}
                    {linkPrefix && linkKey && (
                      <td className="px-4 py-3 text-right">
                        <Link href={`${linkPrefix}${row[linkKey]}${linkSuffix || ''}` as any} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700">{linkLabel || t('acom.btn_open')}</Link>
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

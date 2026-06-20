'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

export function AdminInstructors() {
  const t = useTranslations();
  const [list, setList] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [shares, setShares] = useState<Record<string, number | null>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    Promise.all([
      callAgentOps<{ instructors: any[] }>('admin_list_instructors'),
      sb.rpc('nl_admin_instructor_revshares'),
    ])
      .then(([r, sh]) => {
        const m: Record<string, number | null> = {};
        ((((sh as any).data as any[]) || [])).forEach((x: any) => { m[x.id] = x.pct; });
        setShares(m);
        setList(r.instructors);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const shareStr = (id: string) => (shares[id] !== undefined && shares[id] !== null ? String(shares[id]) : '');
  const fieldVal = (id: string) => (draft[id] !== undefined ? draft[id] : shareStr(id));
  const isDirty = (id: string) => draft[id] !== undefined && draft[id] !== shareStr(id);

  async function saveShare(id: string) {
    setSavingId(id);
    try {
      const raw = fieldVal(id).trim();
      const pct = raw === '' ? null : Number(raw);
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_set_instructor_revshare', { p_id: id, p_pct: pct });
      if (error) throw error;
      const stored = pct === null ? null : Math.max(0, Math.min(100, pct));
      setShares((s) => ({ ...s, [id]: stored }));
      setDraft((d) => { const n = { ...d }; delete n[id]; return n; });
      setSavedId(id);
      setTimeout(() => setSavedId((v) => (v === id ? null : v)), 1500);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSavingId(null);
    }
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err === 'admin_required' || err === 'unauthorized' ? t('acom.access_restricted') : err === 'not_authenticated' ? t('acom.signin_first') : err}</p>
        <Link href={'/login' as any} className="btn-primary mt-6 inline-flex">{t('acom.btn_signin')}</Link>
      </div>
    );
  }
  if (!list) return <DashboardSkeleton stats={4} />;

  const statusColor = (s: string) => s === 'approved' ? 'bg-emerald-100 text-emerald-700' : s === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <AdminPageHeader
        emoji="🎓"
        title={t('admin_instr.title')}
        description={t('admin_instr.subtitle', { n: list.length })}
      />

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">{t('admin_instr.empty')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">{t('admin_instr.col_instructor')}</th>
                  <th className="text-left font-medium px-4 py-3">{t('admin_instr.col_status')}</th>
                  <th className="text-right font-medium px-4 py-3">{t('admin_instr.col_students')}</th>
                  <th className="text-right font-medium px-4 py-3">{t('admin_instr.col_revenue')}</th>
                  <th className="text-right font-medium px-4 py-3">{t('admin_instr.col_revshare')}</th>
                  <th className="text-right font-medium px-4 py-3">{t('admin_instr.col_rating')}</th>
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
                        <span className="font-medium text-slate-900">{i.display_name || t('admin_instr.no_name')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(i.status)}`}>{i.status}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums">{i.total_students || 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtCents(i.total_revenue_cents)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <input
                          type="number" min={0} max={100} inputMode="numeric"
                          value={fieldVal(i.id)}
                          onChange={(e) => setDraft((d) => ({ ...d, [i.id]: e.target.value }))}
                          placeholder={t('admin_instr.revshare_default')}
                          className="w-16 text-right tabular-nums rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
                        />
                        <span className="text-slate-400 text-xs">%</span>
                        {isDirty(i.id) ? (
                          <button onClick={() => saveShare(i.id)} disabled={savingId === i.id}
                            className="text-xs bg-brand-600 text-white px-2 py-1 rounded-md hover:bg-brand-700 disabled:opacity-50">
                            {savingId === i.id ? '…' : t('admin_instr.revshare_save')}
                          </button>
                        ) : savedId === i.id ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{i.rating_avg ? `★ ${Number(i.rating_avg).toFixed(1)}` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/instrutor/${i.id}` as any} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700">{t('admin_instr.view_panel')}</Link>
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

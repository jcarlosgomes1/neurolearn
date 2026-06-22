'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import { Check, ArrowUpRight, Users, Wallet, Star } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in">
      <AdminPageHeader
        emoji="🎓"
        title={t('admin_instr.title')}
        description={t('admin_instr.subtitle', { n: list.length })}
      />

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">{t('admin_instr.empty')}</p>
      ) : (
        <div className="space-y-2.5">
          {list.map((i) => {
            const dirty = isDirty(i.id);
            const toPay = Math.max(0, (i.total_revenue_cents || 0) - (i.total_payouts_cents || 0));
            return (
              <div key={i.id} className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm">
                {/* header */}
                <div className="flex items-start gap-3">
                  {(i.avatar_url || i.profile_picture_url) ? (
                    <img src={i.avatar_url || i.profile_picture_url} alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {(i.display_name || '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/instrutor/${i.id}` as any} className="font-semibold text-[15px] text-slate-900 hover:text-emerald-700 inline-flex items-center gap-1 leading-snug">
                      <span className="truncate">{i.display_name || t('admin_instr.no_name')}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${statusColor(i.status)}`}>{i.status}</span>
                      {i.rating_avg ? <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 font-medium"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(i.rating_avg).toFixed(1)}</span> : null}
                    </div>
                  </div>
                </div>

                {/* stats band */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-slate-600"><Users className="h-3 w-3 text-slate-400" /><b className="text-slate-800">{i.total_students || 0}</b> {t('admin_instr.col_students')}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-800"><Wallet className="h-3 w-3" />{fmtCents(i.total_revenue_cents)}</span>
                  {(i.total_payouts_cents != null) && <span className="text-emerald-700 font-medium">{t('admin_instr.col_revshare')} {fmtCents(toPay)}</span>}
                </div>

                {/* footer: revshare + ver painel */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">{t('admin_instr.col_revshare')}</span>
                    <input
                      type="number" min={0} max={100} inputMode="numeric"
                      value={fieldVal(i.id)}
                      onChange={(e) => setDraft((d) => ({ ...d, [i.id]: e.target.value }))}
                      placeholder={t('admin_instr.revshare_default')}
                      className="w-14 text-right tabular-nums rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
                    />
                    <span className="text-slate-400 text-xs">%</span>
                    {dirty ? (
                      <button onClick={() => saveShare(i.id)} disabled={savingId === i.id}
                        className="text-xs bg-brand-600 text-white px-2 py-1 rounded-md hover:bg-brand-700 disabled:opacity-50">
                        {savingId === i.id ? '…' : t('admin_instr.revshare_save')}
                      </button>
                    ) : savedId === i.id ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : null}
                  </div>
                  <Link href={`/admin/instrutor/${i.id}` as any} className="shrink-0 text-xs font-medium border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:border-emerald-300 hover:text-emerald-700">{t('admin_instr.view_panel')}</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

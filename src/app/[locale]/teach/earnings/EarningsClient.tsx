'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { Wallet, Building2, Loader2, TrendingUp } from 'lucide-react';

interface Sub {
  id: string;
  course_title: string | null;
  org_name: string | null;
  pricing_model: string | null;
  total_price_cents: number | null;
  instructor_payout_cents: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
}
interface EarningsData {
  ok: boolean;
  total_b2b_earnings_cents?: number;
  active_subscriptions?: number;
  subscriptions?: Sub[];
}

export function EarningsClient() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: d, error } = await sb.rpc('nl_marketplace_instructor_b2b_earnings');
      if (error) throw error;
      setData(d as EarningsData);
    } catch {
      setData({ ok: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const money = (cents: number | null | undefined, currency?: string | null) => {
    const v = (cents || 0) / 100;
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'EUR' }).format(v); }
    catch { return v.toFixed(2) + ' ' + (currency || 'EUR'); }
  };
  const fmtDate = (s: string) => { try { return new Date(s).toLocaleDateString(locale); } catch { return ''; } };

  const subs = data?.subscriptions || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet className="w-5 h-5" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">{t('teach.earnings.eyebrow')}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{t('teach.earnings.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">{t('teach.earnings.description')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
              <div className="flex items-center gap-2 text-emerald-700"><TrendingUp className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wide">{t('teach.earnings.total')}</span></div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{money(data?.total_b2b_earnings_cents, subs[0]?.currency)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-500"><Building2 className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wide">{t('teach.earnings.active_subs')}</span></div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{data?.active_subscriptions || 0}</p>
            </div>
          </div>

          {subs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500 text-sm">{t('teach.earnings.empty')}</div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">{t('teach.earnings.col_course')}</th>
                      <th className="text-left font-medium px-4 py-3">{t('teach.earnings.col_org')}</th>
                      <th className="text-right font-medium px-4 py-3">{t('teach.earnings.col_payout')}</th>
                      <th className="text-left font-medium px-4 py-3">{t('teach.earnings.col_status')}</th>
                      <th className="text-left font-medium px-4 py-3">{t('teach.earnings.col_date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subs.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">{s.course_title}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.org_name}</td>
                        <td className="px-4 py-3 text-right text-slate-900 font-semibold whitespace-nowrap">{money(s.instructor_payout_cents, s.currency)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={s.status === 'active' ? 'inline-flex rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-1' : 'inline-flex rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1'}>{s.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

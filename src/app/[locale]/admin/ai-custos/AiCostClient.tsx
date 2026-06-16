'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Loader2, DollarSign, Activity, Zap, CheckCircle2 } from 'lucide-react';

interface StatRow { operation: string; model: string; calls: number; cost_cents: number; avg_duration_ms: number; success_rate: number; input_tokens_total: number; output_tokens_total: number; last_call_at: string; }
interface DayRow { day: string; cost_cents: number; calls: number; }

const WINDOWS = [{ d: 7, l: '7d' }, { d: 30, l: '30d' }, { d: 90, l: '90d' }];
function usd(cents: number) { return '$' + (Number(cents || 0) / 100).toFixed(2); }

export function AiCostClient() {
  const t = useTranslations();
  const sb = useMemo(() => createClient(), []);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [daily, setDaily] = useState<DayRow[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [s, d, m] = await Promise.all([
      sb.rpc('nl_admin_ai_calls_stats', { p_since: since }),
      sb.rpc('nl_admin_ai_cost_daily', { p_days: days }),
      sb.from('nl_ai_models').select('model,label'),
    ]);
    setStats(((s.data || []) as StatRow[]));
    setDaily(((d.data || []) as DayRow[]));
    const map: Record<string, string> = {};
    ((m.data || []) as any[]).forEach((r) => { map[r.model] = r.label || r.model; });
    setLabels(map);
    setLoading(false);
  }, [days, sb]);
  useEffect(() => { load(); }, [load]);

  const totalCents = stats.reduce((a, r) => a + Number(r.cost_cents || 0), 0);
  const totalCalls = stats.reduce((a, r) => a + Number(r.calls || 0), 0);
  const avgPerCall = totalCalls ? totalCents / totalCalls : 0;
  const wSucc = totalCalls ? stats.reduce((a, r) => a + Number(r.success_rate || 0) * Number(r.calls || 0), 0) / totalCalls : 0;
  const succPct = wSucc <= 1 ? wSucc * 100 : wSucc;
  const maxDay = Math.max(1, ...daily.map((d) => Number(d.cost_cents || 0)));

  const byOp = Object.values(stats.reduce((acc, r) => {
    const k = r.operation || '—';
    if (!acc[k]) acc[k] = { key: k, calls: 0, cost_cents: 0 };
    acc[k].calls += Number(r.calls || 0); acc[k].cost_cents += Number(r.cost_cents || 0);
    return acc;
  }, {} as Record<string, { key: string; calls: number; cost_cents: number }>)).sort((a, b) => b.cost_cents - a.cost_cents);

  const byModel = Object.values(stats.reduce((acc, r) => {
    const k = r.model || '—';
    if (!acc[k]) acc[k] = { key: k, calls: 0, cost_cents: 0 };
    acc[k].calls += Number(r.calls || 0); acc[k].cost_cents += Number(r.cost_cents || 0);
    return acc;
  }, {} as Record<string, { key: string; calls: number; cost_cents: number }>)).sort((a, b) => b.cost_cents - a.cost_cents);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>;

  const kpis = [
    { icon: DollarSign, label: t('aicost.kpi.total'), val: usd(totalCents), grad: 'from-emerald-500 to-teal-600' },
    { icon: Activity, label: t('aicost.kpi.calls'), val: totalCalls.toLocaleString(), grad: 'from-blue-500 to-indigo-600' },
    { icon: Zap, label: t('aicost.kpi.avg'), val: usd(avgPerCall), grad: 'from-violet-500 to-fuchsia-600' },
    { icon: CheckCircle2, label: t('aicost.kpi.success'), val: succPct.toFixed(1) + '%', grad: 'from-amber-500 to-orange-600' },
  ];

  const breakdown = (title: string, rows: { key: string; calls: number; cost_cents: number }[], pretty?: (k: string) => string) => (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <p className="text-sm font-bold text-slate-800 p-4 pb-2">{title}</p>
      <div className="divide-y divide-slate-100">
        {rows.length === 0 ? <p className="text-xs text-slate-400 px-4 py-6 text-center">{t('aicost.no_data')}</p> : rows.map((o) => (
          <div key={o.key} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="font-medium text-slate-700 truncate">{pretty ? pretty(o.key) : o.key}</span>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-xs text-slate-400">{o.calls.toLocaleString()} {t('aicost.calls_unit')}</span>
              <span className="font-semibold text-slate-900 tabular-nums w-16 text-right">{usd(o.cost_cents)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {WINDOWS.map((w) => <button key={w.d} onClick={() => setDays(w.d)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${days === w.d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{w.l}</button>)}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${k.grad} text-white mb-2`}><Icon className="h-4 w-4" /></div>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="text-xl font-bold text-slate-900">{k.val}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-bold text-slate-800 mb-3">{t('aicost.by_day')}</p>
        {daily.length === 0 ? <p className="text-xs text-slate-400 py-6 text-center">{t('aicost.no_data')}</p> : (
          <div className="flex items-end gap-1 h-32">
            {daily.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${d.day}: ${usd(d.cost_cents)} (${d.calls})`}>
                <div className="w-full bg-gradient-to-t from-violet-500 to-indigo-400 rounded-t" style={{ height: `${Math.max(2, (Number(d.cost_cents) / maxDay) * 100)}%` }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {breakdown(t('aicost.by_op'), byOp)}
        {breakdown(t('aicost.by_model'), byModel, (k) => labels[k] || k)}
      </div>
    </div>
  );
}

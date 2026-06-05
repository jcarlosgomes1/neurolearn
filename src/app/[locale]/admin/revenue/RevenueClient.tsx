'use client';

import { useState, useTransition } from 'react';
import { revenueDashboardAction } from './actions';
import { DollarSign, TrendingUp, Users, ShoppingCart, RefreshCw, Loader2, Award, Building2 } from 'lucide-react';

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

const WINDOWS = [['7d','7 dias'],['30d','30 dias'],['90d','90 dias'],['12m','12 meses'],['ytd','YTD']];

export function RevenueClient({ initial }: { initial: any }) {
  const [data, setData] = useState<any>(initial);
  const [window, setWindow] = useState('30d');
  const [pending, startTransition] = useTransition();

  function changeWindow(w: string) {
    setWindow(w);
    startTransition(async () => {
      const r = await revenueDashboardAction(w);
      if (r?.ok) setData(r);
    });
  }

  if (!data) return <div className="p-8 text-center text-slate-500">A carregar…</div>;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="h-6 w-6 text-emerald-600" /> Revenue Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">MRR, ARR, GMV, churn, top customers — atualizado a cada request.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
            {WINDOWS.map(([k, label]) => (
              <button key={k} onClick={() => changeWindow(k)}
                className={`px-3 py-1.5 text-xs font-medium ${window === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => changeWindow(window)} disabled={pending} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPI icon={<DollarSign className="h-4 w-4 text-emerald-600" />} label="MRR" value={fmt(data.mrr_cents)} sub={`ARR: ${fmt(data.arr_cents)}`} />
        <KPI icon={<ShoppingCart className="h-4 w-4 text-blue-600" />} label="GMV (período)" value={fmt(data.gmv_cents)} sub={`Plataforma: ${fmt(data.platform_revenue_cents)}`} />
        <KPI icon={<Users className="h-4 w-4 text-violet-600" />} label="Subs activas" value={String(data.active_subscriptions)} sub={`${data.user_subscriptions} B2C · ${data.org_subscriptions} B2B`} />
        <KPI icon={<TrendingUp className="h-4 w-4 text-amber-600" />} label="ARPU" value={fmt(data.arpu_cents)} sub={`AOV: ${fmt(data.avg_order_cents)}`} />
      </div>

      {/* Movement */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPI icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} label="Novas subs" value={String(data.new_subs_period)} accent="emerald" />
        <KPI icon={<TrendingUp className="h-4 w-4 text-rose-600 rotate-180" />} label="Churn" value={String(data.churn_period)} accent="rose" />
        <KPI icon={<DollarSign className="h-4 w-4 text-emerald-600" />} label="Payouts a instrutores" value={fmt(data.payouts_cents)} />
        <KPI icon={<DollarSign className="h-4 w-4 text-slate-600" />} label="Net plataforma" value={fmt(data.platform_revenue_cents)} />
      </div>

      {/* Breakdown por kind */}
      {data.by_kind?.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Receita por tipo</h2>
          <div className="space-y-2">
            {data.by_kind.map((k: any) => {
              const pct = data.gmv_cents > 0 ? (k.gross / data.gmv_cents * 100) : 0;
              return (
                <div key={k.kind} className="flex items-center gap-3">
                  <div className="w-44 text-xs font-medium text-slate-700 truncate">{k.kind}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: Math.max(2, pct) + '%' }} />
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-slate-900">
                      {fmt(k.gross)} · {k.tx_count} tx · {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top orgs + Top instrutores */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Top 10 organizações</h2>
          {data.top_orgs?.length === 0 ? <p className="text-sm text-slate-500">Sem dados</p> : (
            <ul className="space-y-2">{data.top_orgs?.map((o: any, idx: number) => (
              <li key={o.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-xs text-slate-400 font-mono">#{idx+1}</span>
                <span className="flex-1 font-medium text-slate-900 truncate">{o.name}</span>
                <span className="font-semibold tabular-nums">{fmt(o.gmv_cents)}</span>
                <span className="text-xs text-slate-500">{o.tx_count}tx</span>
              </li>
            ))}</ul>
          )}
        </section>
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Award className="h-4 w-4" /> Top 10 instrutores (payout)</h2>
          {data.top_instructors?.length === 0 ? <p className="text-sm text-slate-500">Sem dados</p> : (
            <ul className="space-y-2">{data.top_instructors?.map((i: any, idx: number) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-xs text-slate-400 font-mono">#{idx+1}</span>
                <span className="flex-1 font-medium text-slate-900 truncate">{i.display_name}</span>
                <span className="font-semibold tabular-nums text-emerald-700">{fmt(i.payout_cents)}</span>
                <span className="text-xs text-slate-500">{i.tx_count}tx</span>
              </li>
            ))}</ul>
          )}
        </section>
      </div>

      {/* Daily revenue chart */}
      {data.daily_revenue?.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Receita diária (janela)</h2>
          <DailyChart points={data.daily_revenue} />
        </section>
      )}
    </div>
  );
}

function KPI({ icon, label, value, sub, accent }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider font-semibold">{icon}{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent === 'emerald' ? 'text-emerald-700' : accent === 'rose' ? 'text-rose-700' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function DailyChart({ points }: { points: any[] }) {
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.gross));
  return (
    <div className="flex items-end gap-1 h-32">
      {points.map((p, i) => {
        const h = max > 0 ? (p.gross / max * 100) : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center group">
            <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t" style={{ height: `${Math.max(2, h)}%` }} 
              title={`${p.day}: €${(p.gross/100).toFixed(0)}`} />
            <div className="text-[8px] text-slate-400 mt-1 -rotate-45 origin-top-left whitespace-nowrap">{p.day?.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

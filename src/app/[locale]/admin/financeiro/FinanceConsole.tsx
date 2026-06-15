'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, TrendingUp, Wallet, AlertTriangle, Sliders, Table2,
  Sparkles, ChevronDown, ChevronUp, RefreshCw, Check, Flame, Target,
  Pencil, GitCompare, BarChart3, X,
} from 'lucide-react';

type Channel = { channel_key: string; label: string; enabled: boolean; params: Record<string, number>; sort: number };
type Line = { section: string; line_key: string; label: string; kind: 'revenue' | 'cost'; sort: number };
type PLCell = { line_key: string; period: string; series: string; amount_eur: number };
type Proposal = { id: string; reason: string; params: Record<string, unknown>; created_at: string };
type ScenarioMeta = { id: string; name: string; horizon_months: number; is_baseline: boolean };
type Overview = {
  ok: boolean;
  scenario_id: string;
  scenario: { id: string; name: string; horizon_months: number; params: Record<string, number> };
  scenarios: ScenarioMeta[];
  channels: Channel[];
  lines: Line[];
  pl: PLCell[];
  proposals: Proposal[];
  signals: Record<string, unknown> | null;
};

const SECTION_LABEL: Record<string, string> = {
  revenue: 'Receita',
  cogs: 'Custos diretos (COGS)',
  opex_marketing: 'Marketing & Vendas',
  opex_team: 'Equipa',
  opex_other: 'Outros custos',
};
const SECTION_ORDER = ['revenue', 'cogs', 'opex_marketing', 'opex_team', 'opex_other'];
const SERIES: { key: string; label: string }[] = [
  { key: 'forecast', label: 'Projeção' },
  { key: 'budget', label: 'Orçamento' },
  { key: 'actual', label: 'Real' },
  { key: 'outlook', label: 'Outlook' },
];

const CHANNEL_PARAM_LABELS: Record<string, string> = {
  marketing_monthly_eur: 'Marketing/mês (€)',
  marketing_growth_mom: 'Crescimento marketing (%/mês)',
  cost_per_click_eur: 'Custo por clique (€)',
  visitor_to_lead_pct: 'Visitante → lead (%)',
  lead_to_paid_pct: 'Lead → pagante (%)',
  organic_referral_rate: 'Referência orgânica',
  arpu_month_eur: 'ARPU/mês (€)',
  monthly_churn_pct: 'Churn mensal (%)',
  new_orgs_per_month_base: 'Novas empresas/mês',
  avg_seats_per_org: 'Lugares médios/empresa',
  price_per_seat_month_eur: 'Preço/lugar/mês (€)',
  cost_per_lead_eur: 'Custo por lead (€)',
  lead_to_deal_pct: 'Lead → negócio (%)',
  placement_rate_month: 'Taxa colocação/mês',
  fee_eur: 'Fee colocação (€)',
};

function fmtEur(n: number): string {
  return new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(n) + ' €';
}

function LineChart({ series, height = 160 }: { series: { name: string; color: string; values: number[] }[]; height?: number }) {
  const all = series.flatMap((s) => s.values);
  if (!all.length) return null;
  const max = Math.max(...all, 0);
  const min = Math.min(...all, 0);
  const range = max - min || 1;
  const n = Math.max(...series.map((s) => s.values.length));
  const W = 320, H = height, pad = 4;
  const x = (i: number) => (n <= 1 ? pad : pad + (i * (W - 2 * pad)) / (n - 1));
  const y = (v: number) => H - pad - ((v - min) / range) * (H - 2 * pad);
  const zeroY = y(0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {min < 0 && max > 0 && <line x1={pad} y1={zeroY} x2={W - pad} y2={zeroY} stroke="#e2e8f0" strokeDasharray="3 3" />}
      {series.map((s) => (
        <polyline key={s.name} fill="none" stroke={s.color} strokeWidth="2"
          points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      ))}
    </svg>
  );
}

export function FinanceConsole({ locale: _locale }: { locale: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<'resumo' | 'pl' | 'canais' | 'comparar' | 'agente'>('resumo');
  const [serie, setSerie] = useState<string>('outlook');
  const [openSection, setOpenSection] = useState<string | null>('revenue');
  const [cash, setCash] = useState<number>(50000);
  const [calibrate, setCalibrate] = useState<boolean>(false);
  const [draftParams, setDraftParams] = useState<Record<string, Record<string, number>>>({});
  const [editCell, setEditCell] = useState<{ line: string; period: string; series: string; value: string } | null>(null);
  const [compareData, setCompareData] = useState<Record<string, Overview>>({});
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const load = useCallback(async (scenarioId?: string) => {
    setLoading(true);
    try {
      const { data: d, error } = await supabase.rpc('nl_finance_console_overview', { p_scenario_id: scenarioId ?? null });
      if (error || !(d as Overview)?.ok) throw error || new Error('fail');
      const ov = d as Overview;
      setData(ov);
      const dp: Record<string, Record<string, number>> = {};
      ov.channels.forEach((c) => { dp[c.channel_key] = { ...c.params }; });
      setDraftParams(dp);
    } catch {
      toast.error('Falha ao carregar a consola financeira.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const periods = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.pl.forEach((c) => set.add(c.period));
    return Array.from(set).sort();
  }, [data]);

  const milestoneMonths = useMemo(() => {
    const idxs = [0, 5, 11, 17, 23];
    return idxs.filter((i) => i < periods.length).map((i) => periods[i]);
  }, [periods]);

  const plIndex = useMemo(() => {
    const map = new Map<string, number>();
    data?.pl.forEach((c) => map.set(`${c.line_key}|${c.period}|${c.series}`, c.amount_eur));
    return map;
  }, [data]);

  const val = useCallback((line: string, period: string, s: string) => plIndex.get(`${line}|${period}|${s}`) ?? 0, [plIndex]);

  const totals = useMemo(() => {
    if (!data) return {} as Record<string, { rev: number; cost: number; net: number }>;
    const out: Record<string, { rev: number; cost: number; net: number }> = {};
    periods.forEach((p) => {
      let rev = 0, cost = 0;
      data.lines.forEach((l) => {
        const v = val(l.line_key, p, serie);
        if (l.kind === 'revenue') rev += v; else cost += v;
      });
      out[p] = { rev, cost, net: rev - cost };
    });
    return out;
  }, [data, periods, serie, val]);

  const runway = useMemo(() => {
    if (!periods.length) return null;
    const first = periods[0];
    let rev = 0, cost = 0;
    data?.lines.forEach((l) => {
      const v = val(l.line_key, first, 'outlook');
      if (l.kind === 'revenue') rev += v; else cost += v;
    });
    const net = rev - cost;
    const burn = net < 0 ? -net : 0;
    return { rev, cost, net, burn, months: burn > 0 ? cash / burn : null };
  }, [data, periods, val, cash]);

  async function resimulate() {
    if (!data) return;
    setBusy('sim');
    try {
      const { error } = await supabase.rpc('nl_sim_run_pl', { p_scenario_id: data.scenario_id, p_calibrate: calibrate });
      if (error) throw error;
      await supabase.rpc('nl_finance_build_outlook', { p_scenario_id: data.scenario_id });
      toast.success(calibrate ? 'Projeção recalculada com sinais reais.' : 'Projeção recalculada.');
      await load(data.scenario_id);
    } catch {
      toast.error('Falha ao recalcular.');
    } finally { setBusy(null); }
  }

  async function saveChannel(key: string) {
    if (!data) return;
    setBusy(key);
    try {
      const { error } = await supabase.rpc('nl_finance_save_channel', {
        p_scenario_id: data.scenario_id, p_channel_key: key, p_params: draftParams[key],
      });
      if (error) throw error;
      toast.success('Canal guardado. Recalcula para ver o impacto.');
    } catch {
      toast.error('Falha ao guardar canal.');
    } finally { setBusy(null); }
  }

  async function saveCell() {
    if (!data || !editCell) return;
    const amount = editCell.value === '' ? null : Number(editCell.value);
    setBusy('cell');
    try {
      const periodDate = `${editCell.period}-01`;
      if (editCell.series === 'budget') {
        const { error } = await supabase.rpc('nl_finance_set_budget', {
          p_line_key: editCell.line, p_period: periodDate, p_amount_eur: amount ?? 0,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('nl_finance_set_override', {
          p_scenario_id: data.scenario_id, p_line_key: editCell.line,
          p_period_from: periodDate, p_amount_eur: amount, p_note: 'Ajuste manual (consola)',
        });
        if (error) throw error;
      }
      toast.success('Valor gravado.');
      setEditCell(null);
      await load(data.scenario_id);
    } catch {
      toast.error('Falha ao gravar valor.');
    } finally { setBusy(null); }
  }

  const toggleCompare = useCallback(async (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds((prev) => prev.filter((x) => x !== id));
      return;
    }
    if (!compareData[id]) {
      try {
        const { data: d } = await supabase.rpc('nl_finance_console_overview', { p_scenario_id: id });
        if ((d as Overview)?.ok) setCompareData((prev) => ({ ...prev, [id]: d as Overview }));
      } catch { /* noop */ }
    }
    setCompareIds((prev) => [...prev, id]);
  }, [compareIds, compareData, supabase]);

  function scenarioNet(ov: Overview): { periods: string[]; net: number[]; cum: number[]; finalMrr: number } {
    const idx = new Map<string, number>();
    ov.pl.forEach((c) => { if (c.series === 'outlook') idx.set(`${c.line_key}|${c.period}`, c.amount_eur); });
    const pers = Array.from(new Set(ov.pl.filter((c) => c.series === 'outlook').map((c) => c.period))).sort();
    const net: number[] = []; const cum: number[] = []; let acc = 0; let finalMrr = 0;
    pers.forEach((p) => {
      let rev = 0, cost = 0;
      ov.lines.forEach((l) => {
        const v = idx.get(`${l.line_key}|${p}`) ?? 0;
        if (l.kind === 'revenue') rev += v; else cost += v;
      });
      net.push(rev - cost); acc += rev - cost; cum.push(acc); finalMrr = rev;
    });
    return { periods: pers, net, cum, finalMrr };
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (!data) {
    return <div className="text-center py-24 text-slate-500">Sem dados. <button onClick={() => load()} className="text-indigo-600 underline">Tentar de novo</button></div>;
  }

  const finalPeriod = periods[periods.length - 1];
  const cumProfit = periods.reduce((s, p) => s + (totals[p]?.net ?? 0), 0);
  const palette = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={data.scenario_id} onChange={(e) => load(e.target.value)}
          className="text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white min-w-0 flex-1">
          {data.scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.is_baseline ? ' ★' : ''}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
          <input type="checkbox" checked={calibrate} onChange={(e) => setCalibrate(e.target.checked)} className="rounded" />
          Sinais reais
        </label>
        <button onClick={resimulate} disabled={busy === 'sim'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 hover:bg-indigo-700 disabled:opacity-50">
          {busy === 'sim' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Recalcular
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto -mx-4 px-4">
        {([['resumo', 'Resumo', Target], ['pl', 'P&L', Table2], ['canais', 'Canais', Sliders], ['comparar', 'Comparar', GitCompare], ['agente', 'Agente', Sparkles]] as const).map(([k, lbl, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-4 w-4" />{lbl}
          </button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={TrendingUp} label="MRR final" value={fmtEur(totals[finalPeriod]?.rev ?? 0)} tone="indigo" />
            <Kpi icon={Wallet} label="Lucro acum. (horizonte)" value={fmtEur(cumProfit)} tone={cumProfit >= 0 ? 'emerald' : 'rose'} />
            <Kpi icon={Flame} label="Burn mensal (agora)" value={runway?.burn ? fmtEur(runway.burn) : '—'} tone={runway?.burn ? 'amber' : 'emerald'} />
            <Kpi icon={AlertTriangle} label="Runway" value={runway?.months != null ? `${runway.months.toFixed(1)} meses` : 'Lucrativo'}
              tone={runway?.months != null && runway.months < 6 ? 'rose' : 'emerald'} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-500" />Evolução ({SERIES.find((s) => s.key === serie)?.label})</h3>
            <LineChart series={[
              { name: 'Receita', color: '#6366f1', values: periods.map((p) => totals[p]?.rev ?? 0) },
              { name: 'Custo', color: '#f43f5e', values: periods.map((p) => totals[p]?.cost ?? 0) },
              { name: 'Resultado', color: '#10b981', values: periods.map((p) => totals[p]?.net ?? 0) },
            ]} />
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" />Receita</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />Custo</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Resultado</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm">Caixa disponível</h3>
              <div className="flex items-center gap-2">
                <input type="number" value={cash} onChange={(e) => setCash(Number(e.target.value) || 0)}
                  className="w-28 text-sm rounded-lg border border-slate-200 px-2 py-1 text-right" />
                <span className="text-sm text-slate-500">€</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ao ritmo de queima atual ({runway?.burn ? fmtEur(runway.burn) : '0 €'}/mês), o runway é{' '}
              <strong className={runway?.months != null && runway.months < 6 ? 'text-rose-600' : 'text-emerald-600'}>
                {runway?.months != null ? `${runway.months.toFixed(1)} meses` : 'infinito (já lucrativo)'}
              </strong>.
            </p>
          </div>
        </div>
      )}

      {tab === 'pl' && (
        <div className="space-y-3">
          <div className="flex gap-1.5 flex-wrap items-center">
            {SERIES.map((s) => (
              <button key={s.key} onClick={() => setSerie(s.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${serie === s.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s.label}
              </button>
            ))}
            {(serie === 'budget' || serie === 'forecast' || serie === 'outlook') && (
              <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 ml-1"><Pencil className="h-3 w-3" />toca num valor para editar</span>
            )}
          </div>
          {SECTION_ORDER.map((sec) => {
            const lines = data.lines.filter((l) => l.section === sec);
            if (!lines.length) return null;
            const isOpen = openSection === sec;
            return (
              <div key={sec} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <button onClick={() => setOpenSection(isOpen ? null : sec)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-700">
                  <span>{SECTION_LABEL[sec]}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-400 text-xs">
                          <th className="text-left font-medium px-4 py-2 sticky left-0 bg-white">Rubrica</th>
                          {milestoneMonths.map((p) => <th key={p} className="text-right font-medium px-3 py-2 whitespace-nowrap">{p}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l) => (
                          <tr key={l.line_key} className="border-t border-slate-100">
                            <td className="px-4 py-2 text-slate-600 sticky left-0 bg-white">{l.label}</td>
                            {milestoneMonths.map((p) => {
                              const editable = serie === 'budget' || serie === 'forecast' || serie === 'outlook';
                              return (
                                <td key={p} className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                                  {editable ? (
                                    <button onClick={() => setEditCell({ line: l.line_key, period: p, series: serie === 'outlook' ? 'forecast' : serie, value: String(val(l.line_key, p, serie)) })}
                                      className="text-slate-700 hover:text-indigo-600 hover:underline decoration-dotted">
                                      {fmtEur(val(l.line_key, p, serie))}
                                    </button>
                                  ) : <span className="text-slate-700">{fmtEur(val(l.line_key, p, serie))}</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'canais' && (
        <div className="space-y-3">
          {data.channels.map((c) => (
            <div key={c.channel_key} className="rounded-xl border border-slate-200 p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-sm">{c.label}</h3>
                <button onClick={() => saveChannel(c.channel_key)} disabled={busy === c.channel_key}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 hover:bg-slate-900 disabled:opacity-50">
                  {busy === c.channel_key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Guardar
                </button>
              </div>
              <div className="space-y-2.5">
                {Object.entries(draftParams[c.channel_key] || {}).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3">
                    <label className="text-xs text-slate-600 flex-1 min-w-0">{CHANNEL_PARAM_LABELS[k] || k}</label>
                    <input type="number" step="any" value={v}
                      onChange={(e) => setDraftParams((prev) => ({ ...prev, [c.channel_key]: { ...prev[c.channel_key], [k]: Number(e.target.value) } }))}
                      className="w-28 text-sm rounded-lg border border-slate-200 px-2 py-1 text-right tabular-nums" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 px-1">Valores-base propostos automaticamente. Ajusta e usa "Recalcular" no topo para projetar o impacto.</p>
        </div>
      )}

      {tab === 'comparar' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <h3 className="font-semibold text-slate-800 text-sm mb-2">Escolhe cenários para comparar</h3>
            <div className="flex flex-wrap gap-1.5">
              {data.scenarios.map((s) => (
                <button key={s.id} onClick={() => toggleCompare(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${compareIds.includes(s.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s.name}{s.is_baseline ? ' ★' : ''}
                </button>
              ))}
            </div>
          </div>
          {compareIds.length > 0 && (
            <>
              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <h3 className="font-semibold text-slate-800 text-sm mb-3">Lucro acumulado (outlook)</h3>
                <LineChart series={compareIds.filter((id) => compareData[id]).map((id, i) => ({
                  name: compareData[id].scenario.name, color: palette[i % palette.length], values: scenarioNet(compareData[id]).cum,
                }))} />
                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  {compareIds.filter((id) => compareData[id]).map((id, i) => (
                    <span key={id} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: palette[i % palette.length] }} />{compareData[id].scenario.name}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead><tr className="text-slate-400 text-xs">
                    <th className="text-left font-medium px-4 py-2">Cenário</th>
                    <th className="text-right font-medium px-3 py-2">MRR final</th>
                    <th className="text-right font-medium px-4 py-2">Lucro acum.</th>
                  </tr></thead>
                  <tbody>
                    {compareIds.filter((id) => compareData[id]).map((id) => {
                      const sn = scenarioNet(compareData[id]);
                      const cum = sn.cum[sn.cum.length - 1] ?? 0;
                      return (
                        <tr key={id} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-600">{compareData[id].scenario.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmtEur(sn.finalMrr)}</td>
                          <td className={`px-4 py-2 text-right tabular-nums font-medium ${cum >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtEur(cum)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'agente' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <h3 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" />Sinais reais da plataforma</h3>
            {data.signals ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(data.signals).filter(([k]) => k !== 'computed_at').map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                    <span className="text-slate-500">{k.replace(/_/g, ' ')}</span>
                    <span className="text-slate-800 font-medium tabular-nums">{v == null ? '—' : String(v)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400">Ainda sem sinais fiáveis (pré-lançamento). A projeção usa os valores propostos.</p>}
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <h3 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Desvios detetados</h3>
            {data.proposals.length === 0 ? (
              <p className="text-xs text-slate-400">Sem desvios materiais face ao orçamento. O agente avisa-te aqui quando algo descarrilar.</p>
            ) : (
              <div className="space-y-2">
                {data.proposals.map((p) => (
                  <div key={p.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <p className="text-xs text-slate-700">{p.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {editCell && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setEditCell(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Editar valor</h3>
              <button onClick={() => setEditCell(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {data.lines.find((l) => l.line_key === editCell.line)?.label} · {editCell.period} ·{' '}
              {editCell.series === 'budget' ? 'Orçamento' : 'Override da projeção'}
            </p>
            <div className="flex items-center gap-2">
              <input type="number" autoFocus value={editCell.value}
                onChange={(e) => setEditCell({ ...editCell, value: e.target.value })}
                placeholder="(vazio = repor base)"
                className="flex-1 text-sm rounded-lg border border-slate-200 px-3 py-2 text-right tabular-nums" />
              <span className="text-sm text-slate-500">€</span>
            </div>
            {editCell.series !== 'budget' && (
              <p className="text-[11px] text-slate-400 mt-2">Aplica deste mês em diante. Deixa vazio para repor o valor proposto pelo motor.</p>
            )}
            <button onClick={saveCell} disabled={busy === 'cell'}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50">
              {busy === 'cell' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Gravar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof TrendingUp; label: string; value: string; tone: 'indigo' | 'emerald' | 'rose' | 'amber' }) {
  const tones: Record<string, string> = {
    indigo: 'from-indigo-500 to-violet-500',
    emerald: 'from-emerald-500 to-teal-500',
    rose: 'from-rose-500 to-red-500',
    amber: 'from-amber-500 to-orange-500',
  };
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-white">
      <div className={`inline-flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br ${tones[tone]} text-white mb-2`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-[11px] text-slate-500 leading-tight">{label}</div>
      <div className="text-base font-semibold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

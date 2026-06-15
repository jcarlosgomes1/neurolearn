'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, TrendingUp, Wallet, AlertTriangle, Sliders, Table2,
  Sparkles, RefreshCw, Check, Flame, Target,
  Pencil, GitCompare, BarChart3, X, Lightbulb,
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

type StmtRow = { row_key: string; level: number; kind: string; section: string | null; label: string | null; label_key: string | null; ord: number; total_outlook: number; total_budget: number; total_actual: number | null; total_forecast: number; weight_pct: number | null; var_budget_abs: number; var_budget_pct: number | null };
type StmtCell = { row_key: string; period: string; outlook: number; budget: number; actual: number | null; forecast: number };
type Statement = { ok: boolean; periods: string[]; rows: StmtRow[]; cells: StmtCell[]; kpi: { revenue: number; cogs: number; gross: number; gross_margin_pct: number | null; opex: number; operating: number; operating_margin_pct: number | null; net: number; net_margin_pct: number | null } };

const ROW_LABEL: Record<string, string> = {
  'sub:revenue': 'Receita total', 'sub:cogs': 'Total custos diretos', 'sub:opex_marketing': 'Total Marketing & Vendas',
  'sub:opex_team': 'Total Equipa', 'sub:opex_other': 'Total Outros custos', 'total:gross': 'Lucro bruto',
  'total:opex': 'Total OPEX', 'total:operating': 'Resultado operacional', 'total:net': 'Resultado líquido',
};

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

// Tip subtil para interpretar os dados — texto curto, tom neutro, derivado dos números.
function Tip({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400 px-1 pt-0.5">
      <Lightbulb className="h-3 w-3 mt-0.5 shrink-0 text-slate-300" />
      <span>{children}</span>
    </p>
  );
}

function fmtK(n: number): string {
  const a = Math.abs(n);
  if (a >= 1000) return (n / 1000).toFixed(a >= 10000 ? 0 : 1).replace('.0', '') + 'k';
  return String(Math.round(n));
}

function LineChart({ series, height = 180, labels }: { series: { name: string; color: string; values: number[] }[]; height?: number; labels?: string[] }) {
  const all = series.flatMap((s) => s.values);
  if (!all.length) return null;
  const max = Math.max(...all, 0);
  const min = Math.min(...all, 0);
  const range = max - min || 1;
  const n = Math.max(...series.map((s) => s.values.length));
  const W = 340, H = height, padL = 46, padR = 8, padT = 8, padB = labels ? 18 : 8;
  const x = (i: number) => (n <= 1 ? padL : padL + (i * (W - padL - padR)) / (n - 1));
  const y = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB);
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => min + (range * i) / ticks);
  const zeroY = y(0);
  const labIdx = labels ? Array.from(new Set([0, Math.floor((n - 1) / 2), n - 1])).filter((v) => v >= 0) : [];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {tickVals.map((tv, i) => (
        <g key={i}>
          <line x1={padL} y1={y(tv)} x2={W - padR} y2={y(tv)} stroke="#f1f5f9" strokeWidth="1" />
          <text x={padL - 4} y={y(tv) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{fmtK(tv)}</text>
        </g>
      ))}
      {min < 0 && max > 0 && <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#cbd5e1" strokeDasharray="3 3" />}
      {series.map((s) => (
        <polyline key={s.name} fill="none" stroke={s.color} strokeWidth="2"
          points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      ))}
      {labels && labIdx.map((i) => (
        <text key={i} x={x(i)} y={H - 4} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="9" fill="#94a3b8">{labels[i]}</text>
      ))}
    </svg>
  );
}

export function FinanceConsole({ locale: _locale }: { locale: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<Overview | null>(null);
  const [stmt, setStmt] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<'resumo' | 'pl' | 'canais' | 'comparar' | 'agente'>('resumo');
  const [serie, setSerie] = useState<string>('outlook');
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
      try {
        const { data: st } = await supabase.rpc('nl_finance_pl_statement', { p_scenario_id: ov.scenario_id });
        setStmt((st as Statement)?.ok ? (st as Statement) : null);
      } catch { setStmt(null); }
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
          p_line_key: editCell.line, p_period: periodDate, p_amount_eur: amount ?? 0, p_scenario_id: data.scenario_id,
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

  // ---- tips derivadas dos dados (interpretacao subtil) ----
  // mes de break-even mensal (primeiro net >= 0)
  const breakEvenIdx = periods.findIndex((p) => (totals[p]?.net ?? 0) >= 0);
  const breakEvenLabel = breakEvenIdx >= 0 ? periods[breakEvenIdx] : null;
  // mix de receita no ultimo periodo
  const revMix = (() => {
    if (!data || !finalPeriod) return null;
    const b2c = val('rev_b2c', finalPeriod, serie);
    const b2b = val('rev_b2b', finalPeriod, serie);
    const tal = val('rev_talent', finalPeriod, serie);
    const tot = b2c + b2b + tal;
    if (tot <= 0) return null;
    return { b2c: Math.round((b2c / tot) * 100), b2b: Math.round((b2b / tot) * 100), tal: Math.round((tal / tot) * 100) };
  })();

  const tipResumo = (() => {
    if (runway?.burn === 0) return 'Já estás com resultado mensal positivo no arranque — o foco passa a ser acelerar sem perder margem.';
    if (breakEvenLabel) return `Com estes pressupostos, o resultado mensal fica positivo por volta de ${breakEvenLabel}. O lucro acumulado demora mais a virar — é o investimento inicial a ser recuperado.`;
    if (runway?.months != null && runway.months < 6) return `Runway curto (${runway.months.toFixed(1)} meses): ou reduzes o ritmo de queima, ou garantes caixa, antes de escalar a equipa.`;
    return 'O resultado mensal ainda é negativo em todo o horizonte — experimenta reduzir custos de equipa cedo ou subir a conversão nos Canais.';
  })();

  const tipPL = serie === 'actual'
    ? 'Série Real: vem da plataforma. Compara-a com o Orçamento para veres onde estás a desviar-te do plano.'
    : serie === 'budget'
      ? 'O Orçamento é o teu plano congelado. Define aqui os limites por rubrica; o agente compara-os com o Real e avisa desvios.'
      : serie === 'outlook'
        ? 'O Outlook junta o que já aconteceu (Real) com a projeção do que falta — é a melhor estimativa de onde vais aterrar.'
        : 'A Projeção é teórica (parâmetros dos Canais). Toca num valor para fixar um override quando souberes melhor.';

  const tipCanais = revMix
    ? `No fim do horizonte, a receita reparte-se ~${revMix.b2b}% B2B / ${revMix.b2c}% B2C / ${revMix.tal}% Talent. O canal dominante é onde pequenas melhorias de conversão ou churn têm mais impacto.`
    : 'Ajusta um parâmetro de cada vez e recalcula — assim isolas o efeito de cada alavanca no resultado.';

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
            ]} labels={periods} />
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
          <Tip>{tipResumo}</Tip>
        </div>
      )}

      {tab === 'pl' && stmt && (() => {
        const cellMap = new Map<string, StmtCell>();
        stmt.cells.forEach((c) => cellMap.set(`${c.row_key}|${c.period}`, c));
        const per = stmt.periods || [];
        const msIdx = Array.from(new Set([0, Math.floor(per.length * 0.25), Math.floor(per.length * 0.5), Math.floor(per.length * 0.75), per.length - 1])).filter((i) => i >= 0 && i < per.length);
        const ms = msIdx.map((i) => per[i]);
        const sv = (c: StmtCell | undefined) => !c ? 0 : (serie === 'budget' ? c.budget : serie === 'actual' ? (c.actual ?? 0) : serie === 'forecast' ? c.forecast : c.outlook);
        const rowTotal = (r: StmtRow) => serie === 'budget' ? r.total_budget : serie === 'actual' ? (r.total_actual ?? 0) : serie === 'forecast' ? r.total_forecast : r.total_outlook;
        const goodHigher = (r: StmtRow) => r.kind === 'revenue' || ['sub:revenue', 'total:gross', 'total:operating', 'total:net'].includes(r.row_key);
        const editable = serie === 'budget' || serie === 'forecast' || serie === 'outlook';
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <KMini label="Receita (horizonte)" value={fmtEur(stmt.kpi.revenue)} />
              <KMini label="Margem bruta" value={stmt.kpi.gross_margin_pct != null ? `${stmt.kpi.gross_margin_pct}%` : '—'} />
              <KMini label="Resultado operacional" value={fmtEur(stmt.kpi.operating)} tone={stmt.kpi.operating >= 0 ? 'emerald' : 'rose'} />
              <KMini label="Margem operacional" value={stmt.kpi.operating_margin_pct != null ? `${stmt.kpi.operating_margin_pct}%` : '—'} tone={(stmt.kpi.operating_margin_pct ?? 0) >= 0 ? 'emerald' : 'rose'} />
            </div>
            <div className="flex gap-1.5 flex-wrap items-center">
              {SERIES.map((s) => (
                <button key={s.key} onClick={() => setSerie(s.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${serie === s.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s.label}</button>
              ))}
              {editable && <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 ml-1"><Pencil className="h-3 w-3" />toca num valor para editar</span>}
            </div>
            <Tip>{tipPL}</Tip>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-[11px] border-b border-slate-200">
                      <th className="text-left font-medium px-3 py-2 sticky left-0 bg-white z-10">Rubrica</th>
                      <th className="text-right font-medium px-3 py-2 whitespace-nowrap">Total</th>
                      <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Peso</th>
                      <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Δ Orç.</th>
                      {ms.map((p) => <th key={p} className="text-right font-medium px-3 py-2 whitespace-nowrap">{p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {stmt.rows.map((r) => {
                      const label = r.level === 0 ? (r.label || r.row_key) : (ROW_LABEL[r.row_key] || r.label_key || r.row_key);
                      const rowCls = r.level === 2 ? 'bg-slate-100 font-semibold text-slate-900' : r.level === 1 ? 'bg-slate-50 font-medium text-slate-700' : 'text-slate-600';
                      const stickyBg = r.level === 2 ? 'bg-slate-100' : r.level === 1 ? 'bg-slate-50' : 'bg-white';
                      const vt = r.var_budget_abs === 0 ? 'text-slate-300' : (goodHigher(r) ? (r.var_budget_abs >= 0 ? 'text-emerald-600' : 'text-rose-600') : (r.var_budget_abs <= 0 ? 'text-emerald-600' : 'text-rose-600'));
                      return (
                        <tr key={r.row_key} className={`border-t border-slate-100 ${rowCls}`}>
                          <td className={`px-3 py-2 sticky left-0 z-10 ${stickyBg}`}>{label}</td>
                          <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{fmtEur(rowTotal(r))}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-[11px] text-slate-400 whitespace-nowrap">{r.weight_pct != null ? `${r.weight_pct}%` : ''}</td>
                          <td className={`px-2 py-2 text-right tabular-nums text-[11px] whitespace-nowrap ${vt}`} title="Outlook vs Orçamento">{r.var_budget_abs !== 0 ? `${r.var_budget_abs > 0 ? '+' : ''}${fmtK(r.var_budget_abs)}${r.var_budget_pct != null ? ` (${r.var_budget_pct > 0 ? '+' : ''}${r.var_budget_pct}%)` : ''}` : '—'}</td>
                          {ms.map((p) => {
                            const c = cellMap.get(`${r.row_key}|${p}`);
                            const v = sv(c);
                            return (
                              <td key={p} className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                                {r.level === 0 && editable ? (
                                  <button onClick={() => setEditCell({ line: r.row_key, period: p, series: serie === 'outlook' ? 'forecast' : serie, value: String(v) })}
                                    className="hover:text-indigo-600 hover:underline decoration-dotted">{fmtEur(v)}</button>
                                ) : <span>{fmtEur(v)}</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
      {tab === 'pl' && !stmt && <div className="text-center py-10 text-sm text-slate-400">A preparar o P&L…</div>}

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
          <Tip>{tipCanais}</Tip>
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
              <Tip>O cenário com maior lucro acumulado nem sempre é o melhor — cruza-o com o runway de cada um: crescer mais rápido costuma exigir mais caixa antes do retorno.</Tip>
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
          <Tip>Liga "Sinais reais" no topo e recalcula para a projeção passar a usar estes dados em vez dos valores propostos — quanto mais histórico real, mais fiável fica.</Tip>
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

function KMini({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'emerald' | 'rose' }) {
  const c = tone === 'emerald' ? 'text-emerald-600' : tone === 'rose' ? 'text-rose-600' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-white">
      <div className="text-[11px] text-slate-500 leading-tight">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${c}`}>{value}</div>
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

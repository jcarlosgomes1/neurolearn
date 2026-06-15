'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, TrendingUp, Wallet, AlertTriangle, Sliders, Table2,
  Sparkles, RefreshCw, Check, Flame, Target,
  Pencil, GitCompare, BarChart3, X, Lightbulb, ChevronDown,
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

type Comp = { line_key: string; comp_key: string; label: string; weight_pct: number; sort: number };

const ROW_LABEL: Record<string, string> = {
  'sub:revenue': 'Receita total', 'sub:cogs': 'Total custos diretos', 'sub:opex_marketing': 'Total Marketing & Vendas',
  'sub:opex_team': 'Total Equipa', 'sub:opex_other': 'Total Outros custos', 'total:gross': 'Lucro bruto',
  'total:opex': 'Total OPEX', 'total:operating': 'Resultado operacional', 'total:net': 'Resultado líquido',
};

const SERIES: { key: string; label: string }[] = [
  { key: 'forecast', label: 'Proposto' },
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

function fmtKE(n: number): string {
  const v = n / 1000;
  const d = Math.abs(v) < 100 ? 1 : 0;
  return new Intl.NumberFormat('pt-PT', { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(v) + ' k€';
}
function cellSeriesVal(c: StmtCell | undefined, sk: string): number {
  if (!c) return 0;
  return sk === 'budget' ? c.budget : sk === 'actual' ? (c.actual ?? 0) : sk === 'forecast' ? c.forecast : c.outlook;
}
type FYear = { idx: number; label: string; months: string[] };
function buildYears(periods: string[]): FYear[] {
  const byY = new Map<string, string[]>();
  periods.forEach((p) => { const k = p.slice(0, 4); const a = byY.get(k) || []; a.push(p); byY.set(k, a); });
  return Array.from(byY.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([k, months], idx) => ({ idx, label: k, months: [...months].sort() }));
}
const PNL_METRICS: { key: string; label: string; good: boolean }[] = [
  { key: 'revenue', label: 'Receita', good: true },
  { key: 'gross', label: 'Result. bruto', good: true },
  { key: 'opex', label: 'OPEX', good: false },
  { key: 'operating', label: 'Result. operac.', good: true },
];
const PNL_COLORS: Record<string, string> = { forecast: '#6366f1', budget: '#f59e0b', outlook: '#10b981', actual: '#64748b' };
const PNL_METRIC_COLORS: Record<string, string> = { revenue: '#10b981', gross: '#6366f1', opex: '#f59e0b', operating: '#ef4444' };

function PnlChart({ months, series, type, cumulative, height = 200 }: { months: string[]; series: { name: string; color: string; values: number[] }[]; type: 'line' | 'col'; cumulative: boolean; height?: number }) {
  const ser = series.map((sx) => ({ ...sx, values: cumulative ? sx.values.reduce((a: number[], v) => { a.push((a.length ? a[a.length - 1] : 0) + v); return a; }, []) : sx.values }));
  const all = ser.flatMap((sx) => sx.values);
  if (!all.length) return null;
  const max = Math.max(...all, 0), min = Math.min(...all, 0), range = max - min || 1;
  const n = months.length;
  const W = 360, H = height, padL = 44, padR = 10, padT = 10, padB = 22;
  const x = (i: number) => (n <= 1 ? padL : padL + (i * (W - padL - padR)) / (n - 1));
  const groupW = (W - padL - padR) / n;
  const xb = (i: number) => padL + (i + 0.5) * groupW;
  const y = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB);
  const tickVals = Array.from({ length: 5 }, (_, i) => min + (range * i) / 4);
  const zeroY = y(0);
  const barW = Math.max(2, (groupW * 0.8) / Math.max(1, ser.length));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {tickVals.map((tv, i) => (
        <g key={i}>
          <line x1={padL} y1={y(tv)} x2={W - padR} y2={y(tv)} stroke="#f1f5f9" />
          <text x={padL - 4} y={y(tv) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{fmtK(tv)}</text>
        </g>
      ))}
      {months.map((p, i) => ({ p, i })).filter(({ p }) => p.slice(5, 7) === '06' || p.slice(5, 7) === '12').map(({ i }) => (
        <line key={`m${i}`} x1={type === 'col' ? xb(i) : x(i)} y1={padT} x2={type === 'col' ? xb(i) : x(i)} y2={H - padB} stroke="#e2e8f0" strokeDasharray="2 3" />
      ))}
      {min < 0 && max > 0 && <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#cbd5e1" />}
      {type === 'line'
        ? ser.map((sx) => <polyline key={sx.name} fill="none" stroke={sx.color} strokeWidth="2" points={sx.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />)
        : ser.map((sx, si) => sx.values.map((v, i) => {
            const bx = padL + i * groupW + groupW * 0.1 + si * barW;
            const yy = Math.min(y(v), zeroY), hh = Math.abs(y(v) - zeroY);
            return <rect key={`${sx.name}${i}`} x={bx} y={yy} width={barW} height={Math.max(1, hh)} rx="1" fill={sx.color} />;
          }))}
      {Array.from(new Set([0, months.findIndex((p) => p.slice(5, 7) === '06'), n - 1])).filter((i) => i >= 0).map((i) => (
        <text key={`x${i}`} x={type === 'col' ? xb(i) : x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="9" fill="#94a3b8">{`${Number(months[i].slice(5, 7))}/${months[i].slice(2, 4)}`}</text>
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
  const [editCell, setEditCell] = useState<{ line: string; series: string; value: string; from: string; to: string; label: string } | null>(null);
  const [plYear, setPlYear] = useState(0);
  const [plType, setPlType] = useState<'line' | 'col'>('line');
  const [plMetricsSel, setPlMetricsSel] = useState<string[]>(['revenue', 'opex']);
  const [laborCfg, setLaborCfg] = useState<{ spy: number; ss: number; misc: number }>({ spy: 14, ss: 23.75, misc: 5 });
  const [plOpen, setPlOpen] = useState<Set<string>>(new Set());
  const [comps, setComps] = useState<Comp[]>([]);
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
        const [{ data: st }, { data: cp }] = await Promise.all([
          supabase.rpc('nl_finance_pl_statement', { p_scenario_id: ov.scenario_id }),
          supabase.rpc('nl_finance_pl_components', { p_scenario_id: ov.scenario_id }),
        ]);
        const stt = (st as Statement)?.ok ? (st as Statement) : null;
        setStmt(stt);
        setComps(((cp as { components?: Comp[] })?.components) || []);
        try {
          const { data: lc } = await supabase.rpc('nl_finance_config_get');
          const rows = ((lc as { config?: { key: string; value_num: number }[] })?.config) || [];
          const g = (k: string, d: number) => { const r = rows.find((x) => x.key === k); return r ? Number(r.value_num) : d; };
          setLaborCfg({ spy: g('payroll_salaries_per_year', 14), ss: g('payroll_ss_pct', 23.75), misc: g('payroll_misc_pct', 5) });
        } catch { /* */ }
        if (stt) { const subs = stt.rows.filter((r) => r.level === 1).map((r) => r.row_key); setPlOpen((prev) => (prev.size ? prev : new Set(subs))); }
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
    if (!data || !stmt || !editCell) return;
    const amount = editCell.value === '' ? null : Number(editCell.value);
    setBusy('cell');
    try {
      if (editCell.series === 'budget') {
        const fromY = editCell.from.slice(0, 7), toY = editCell.to.slice(0, 7);
        const months = (stmt.periods || []).filter((mp) => mp >= fromY && mp <= toY);
        for (const mp of months) {
          const { error } = await supabase.rpc('nl_finance_set_budget', { p_line_key: editCell.line, p_period: `${mp}-01`, p_amount_eur: amount ?? 0, p_scenario_id: data.scenario_id });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.rpc('nl_finance_set_override', { p_scenario_id: data.scenario_id, p_line_key: editCell.line, p_period_from: editCell.from, p_amount_eur: amount, p_note: 'Valor mensal (consola)', p_period_to: editCell.to });
        if (error) throw error;
      }
      toast.success('Valor mensal aplicado ao ano.');
      setEditCell(null);
      await load(data.scenario_id);
    } catch {
      toast.error('Falha ao gravar valor.');
    } finally { setBusy(null); }
  }

  async function saveLaborCfg(next: { spy: number; ss: number; misc: number }) {
    try {
      await Promise.all([
        supabase.rpc('nl_finance_config_set', { p_key: 'payroll_salaries_per_year', p_value: next.spy }),
        supabase.rpc('nl_finance_config_set', { p_key: 'payroll_ss_pct', p_value: next.ss }),
        supabase.rpc('nl_finance_config_set', { p_key: 'payroll_misc_pct', p_value: next.misc }),
      ]);
      toast.success('Encargos laborais atualizados.');
    } catch { toast.error('Falha ao gravar encargos.'); }
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
        const years = buildYears(stmt.periods || []);
        if (!years.length) return <div className="text-center py-10 text-sm text-slate-400">Sem dados de P&L.</div>;
        const yr = years[Math.min(plYear, years.length - 1)];
        const nM = yr.months.length;
        const cmap = new Map<string, StmtCell>();
        stmt.cells.forEach((c) => cmap.set(`${c.row_key}|${c.period}`, c));
        const lines = stmt.rows.filter((r) => r.level === 0);
        const laborFactor = (laborCfg.spy / 12) * (1 + laborCfg.ss / 100 + laborCfg.misc / 100);
        const lf = (l: StmtRow) => (l.section === 'opex_team' ? laborFactor : 1);
        const isOpex = (l: StmtRow) => (l.section || '').startsWith('opex');
        const aggM = (pred: (l: StmtRow) => boolean, sk: string) => yr.months.map((p) => lines.filter(pred).reduce((acc, l) => acc + cellSeriesVal(cmap.get(`${l.row_key}|${p}`), sk) * lf(l), 0));
        const metricMonthly = (metric: string, sk: string): number[] => {
          if (metric === 'revenue') return aggM((l) => l.kind === 'revenue', sk);
          if (metric === 'cogs') return aggM((l) => l.section === 'cogs', sk);
          if (metric === 'opex') return aggM(isOpex, sk);
          if (metric === 'gross') { const r = aggM((l) => l.kind === 'revenue', sk), c = aggM((l) => l.section === 'cogs', sk); return r.map((v, i) => v - c[i]); }
          const r = aggM((l) => l.kind === 'revenue', sk), c = aggM((l) => l.section === 'cogs', sk), o = aggM(isOpex, sk);
          return r.map((v, i) => v - c[i] - o[i]);
        };
        const rowMonthly = (row: StmtRow, sk: string): number[] => {
          if (row.level === 0) return yr.months.map((p) => cellSeriesVal(cmap.get(`${row.row_key}|${p}`), sk) * lf(row));
          switch (row.row_key) {
            case 'sub:revenue': return aggM((l) => l.kind === 'revenue', sk);
            case 'sub:cogs': return aggM((l) => l.section === 'cogs', sk);
            case 'sub:opex_marketing': return aggM((l) => l.section === 'opex_marketing', sk);
            case 'sub:opex_team': return aggM((l) => l.section === 'opex_team', sk);
            case 'sub:opex_other': return aggM((l) => l.section === 'opex_other', sk);
            case 'total:gross': return metricMonthly('gross', sk);
            case 'total:opex': return aggM(isOpex, sk);
            case 'total:operating':
            case 'total:net': return metricMonthly('operating', sk);
            default: return yr.months.map(() => 0);
          }
        };
        const sumA = (a: number[], k?: number) => a.slice(0, k ?? a.length).reduce((x, v) => x + v, 0);
        const goodHigher = (r: StmtRow) => r.kind === 'revenue' || ['sub:revenue', 'total:gross', 'total:operating', 'total:net'].includes(r.row_key);
        const editableSerie = serie === 'budget' || serie === 'outlook';
        const nMy = yr.months.length;
        const yy = yr.label.slice(2);
        const midCount = yr.months.filter((p) => p.slice(5, 7) <= '06').length || nMy;
        const hasMid = midCount < nMy && midCount > 0;
        const lastMM = Number(yr.months[nMy - 1].slice(5, 7));
        const midLabel = hasMid ? `6/${yy}` : `${lastMM}/${yy}`;
        const endLabel = `${lastMM}/${yy}`;
        const subKeys = stmt.rows.filter((r) => r.level === 1).map((r) => r.row_key);
        const teamLineKeys = lines.filter((l) => l.section === 'opex_team').map((l) => l.row_key);
        const denomL = 1 + laborCfg.ss / 100 + laborCfg.misc / 100;
        const laborComps: { comp_key: string; label: string; weight_pct: number }[] = [
          { comp_key: 'venc', label: 'Vencimento base', weight_pct: (1 / denomL) * 100 },
          { comp_key: 'ss', label: `Segurança Social (${laborCfg.ss}%)`, weight_pct: ((laborCfg.ss / 100) / denomL) * 100 },
          { comp_key: 'misc', label: `Diversos/Seguros (${laborCfg.misc}%)`, weight_pct: ((laborCfg.misc / 100) / denomL) * 100 },
        ];
        const compsByLine = new Map<string, Comp[]>();
        comps.forEach((c) => { const a = compsByLine.get(c.line_key) || []; a.push(c); compsByLine.set(c.line_key, a); });
        const compsFor = (l: StmtRow): { comp_key: string; label: string; weight_pct: number }[] => (l.section === 'opex_team' ? laborComps : (compsByLine.get(l.row_key) || []));
        const compLineKeys = Array.from(new Set([...comps.map((c) => c.line_key), ...teamLineKeys]));
        const expandable = [...subKeys, ...compLineKeys];
        const allOpen = expandable.length > 0 && expandable.every((k) => plOpen.has(k));
        const togglePlOpen = (k: string) => setPlOpen((prev) => { const nx = new Set(prev); if (nx.has(k)) nx.delete(k); else nx.add(k); return nx; });
        const chartSeries = plMetricsSel.map((mk) => ({ name: PNL_METRICS.find((x) => x.key === mk)?.label || mk, color: PNL_METRIC_COLORS[mk] || '#999', values: metricMonthly(mk, serie) }));

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-1.5">
                {years.map((yy) => (
                  <button key={yy.idx} onClick={() => setPlYear(yy.idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${plYear === yy.idx ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{yy.label}</button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">{yr.months[0]} → {yr.months[nM - 1]}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PNL_METRICS.map((m) => {
                const ol = metricMonthly(m.key, 'outlook'); const c12 = sumA(ol); const c6 = sumA(ol, midCount); const mensal = c12 / nMy;
                const d = c12 - sumA(metricMonthly(m.key, 'budget'));
                const dGood = m.good ? d >= 0 : d <= 0;
                return (
                  <div key={m.key} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-400 mb-1">{m.label}</div>
                    <div className="text-base font-bold text-slate-900 tabular-nums leading-none">{fmtKE(c12)}</div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{midLabel} {fmtKE(c6)}</span>
                      <span>{fmtEur(Math.round(mensal))}/mês</span>
                    </div>
                    <div className={`mt-1 text-[10px] font-medium ${dGood ? 'text-emerald-600' : 'text-rose-600'}`}>{d >= 0 ? '+' : ''}{fmtKE(d)} vs orç.</div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex gap-1 flex-wrap">
                  {PNL_METRICS.map((m) => {
                    const on = plMetricsSel.includes(m.key);
                    return (
                      <button key={m.key} onClick={() => setPlMetricsSel((prev) => prev.includes(m.key) ? (prev.length > 1 ? prev.filter((k) => k !== m.key) : prev) : [...prev, m.key])}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${on ? 'text-white' : 'bg-slate-100 text-slate-600'}`} style={on ? { background: PNL_METRIC_COLORS[m.key] } : undefined}>
                        <span className="h-2 w-2 rounded-full" style={{ background: on ? '#fff' : PNL_METRIC_COLORS[m.key] }} />{m.label}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setPlType(plType === 'line' ? 'col' : 'line')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                  {plType === 'line' ? <BarChart3 className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  {plType === 'line' ? 'Colunas' : 'Linhas'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-1">Acumulado no ano (k€) · série {SERIES.find((x) => x.key === serie)?.label} · marcas em {midLabel} e {endLabel}</p>
              <PnlChart months={yr.months} type={plType} cumulative series={chartSeries} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {chartSeries.map((cs) => (
                  <span key={cs.name} className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="h-2 w-2 rounded-full" style={{ background: cs.color }} />{cs.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-2"><Sliders className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-700">Encargos laborais (Portugal)</h3></div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-[11px] text-slate-500 block">Salários/ano
                  <input type="number" value={laborCfg.spy} onChange={(e) => setLaborCfg({ ...laborCfg, spy: Number(e.target.value) || 0 })} className="mt-1 w-full text-sm rounded-lg border border-slate-200 px-2 py-1.5 tabular-nums" />
                </label>
                <label className="text-[11px] text-slate-500 block">Seg. Social %
                  <input type="number" value={laborCfg.ss} onChange={(e) => setLaborCfg({ ...laborCfg, ss: Number(e.target.value) || 0 })} className="mt-1 w-full text-sm rounded-lg border border-slate-200 px-2 py-1.5 tabular-nums" />
                </label>
                <label className="text-[11px] text-slate-500 block">Diversos %
                  <input type="number" value={laborCfg.misc} onChange={(e) => setLaborCfg({ ...laborCfg, misc: Number(e.target.value) || 0 })} className="mt-1 w-full text-sm rounded-lg border border-slate-200 px-2 py-1.5 tabular-nums" />
                </label>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400">Custo equipa = vencimento × {laborCfg.spy}/12 × (1 + {laborCfg.ss}% + {laborCfg.misc}%) = fator ×{laborFactor.toFixed(3)}</span>
                <button onClick={() => saveLaborCfg(laborCfg)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700"><Check className="h-3.5 w-3.5" />Gravar</button>
              </div>
            </div>

            <div>
              <div className="flex gap-1.5 flex-wrap items-center mb-2">
                {SERIES.map((sx) => (
                  <button key={sx.key} onClick={() => setSerie(sx.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${serie === sx.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{sx.label}</button>
                ))}
                {editableSerie && <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 ml-1"><Pencil className="h-3 w-3" />toca no valor mensal</span>}
                <button onClick={() => setPlOpen(allOpen ? new Set() : new Set(expandable))} className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${allOpen ? '' : '-rotate-90'}`} />{allOpen ? 'Recolher tudo' : 'Expandir tudo'}
                </button>
              </div>
              <Tip>{tipPL}</Tip>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white mt-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-[11px] border-b border-slate-200">
                        <th className="text-left font-medium px-3 py-2 sticky left-0 bg-white z-10">Rubrica</th>
                        <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Mensal (€)</th>
                        <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Acum. {midLabel}</th>
                        <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Acum. {endLabel}</th>
                        <th className="text-right font-medium px-2 py-2 whitespace-nowrap">Δ Orç.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const childrenOf = (subKey: string) => lines.filter((l) => l.section === subKey.slice(4)).sort((a, b) => a.ord - b.ord);
                        const display = stmt.rows.filter((r) => r.level >= 1).sort((a, b) => a.ord - b.ord);
                        const valsCells = (m: number[]) => { const c12 = sumA(m); return { c12, c6: sumA(m, midCount), mensal: c12 / nMy }; };
                        const rowTr = (r: StmtRow, isChild: boolean) => {
                          const m = rowMonthly(r, serie);
                          const { c12, c6, mensal } = valsCells(m);
                          const dv = c12 - sumA(rowMonthly(r, 'budget'));
                          const isSub = r.level === 1; const isTotal = r.level === 2;
                          const open = plOpen.has(r.row_key);
                          const hasComps = isChild && compsFor(r).length > 0;
                          const label = ROW_LABEL[r.row_key] || r.label || r.label_key || r.row_key;
                          const rowCls = isTotal ? 'bg-slate-100 font-semibold text-slate-900' : isSub ? 'bg-slate-50 font-medium text-slate-700' : 'text-slate-600';
                          const stickyBg = isTotal ? 'bg-slate-100' : isSub ? 'bg-slate-50' : 'bg-white';
                          const vt = dv === 0 ? 'text-slate-300' : (goodHigher(r) ? (dv >= 0 ? 'text-emerald-600' : 'text-rose-600') : (dv <= 0 ? 'text-emerald-600' : 'text-rose-600'));
                          const canEdit = isChild && editableSerie;
                          return (
                            <tr key={r.row_key} className={`border-t border-slate-100 ${rowCls}`}>
                              <td className={`px-3 py-2 sticky left-0 z-10 ${stickyBg}`}>
                                {isSub ? (
                                  <button onClick={() => togglePlOpen(r.row_key)} className="inline-flex items-center gap-1.5 text-left">
                                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />{label}
                                  </button>
                                ) : isChild ? (
                                  hasComps ? (
                                    <button onClick={() => togglePlOpen(r.row_key)} className="inline-flex items-center gap-1 text-left pl-3 text-slate-500">
                                      <ChevronDown className={`h-3 w-3 text-slate-300 transition-transform ${open ? '' : '-rotate-90'}`} />{r.label || r.row_key}
                                    </button>
                                  ) : <span className="pl-[26px] block text-slate-500">{r.label || r.row_key}</span>
                                ) : <span>{label}</span>}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                                {canEdit ? (
                                  <button onClick={() => setEditCell({ line: r.row_key, series: serie, value: String(Math.round(mensal / lf(r))), from: `${yr.months[0]}-01`, to: `${yr.months[nM - 1]}-01`, label: r.label || r.row_key })}
                                    className="hover:text-indigo-600 hover:underline decoration-dotted">{fmtEur(Math.round(mensal))}</button>
                                ) : <span>{fmtEur(Math.round(mensal))}</span>}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums text-slate-500 whitespace-nowrap">{fmtKE(c6)}</td>
                              <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{fmtKE(c12)}</td>
                              <td className={`px-2 py-2 text-right tabular-nums text-[11px] whitespace-nowrap ${vt}`}>{dv !== 0 ? `${dv > 0 ? '+' : ''}${fmtKE(dv)}` : '—'}</td>
                            </tr>
                          );
                        };
                        const compTr = (l: StmtRow, c: { comp_key: string; label: string; weight_pct: number }) => {
                          const lm = rowMonthly(l, serie).map((v) => (v * c.weight_pct) / 100);
                          const { c12, c6, mensal } = valsCells(lm);
                          return (
                            <tr key={`${l.row_key}:${c.comp_key}`} className="border-t border-slate-100 text-slate-400">
                              <td className="px-3 py-1.5 sticky left-0 z-10 bg-white"><span className="pl-[42px] block text-[12px]">{c.label} <span className="text-slate-300">· {c.weight_pct}%</span></span></td>
                              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-[12px]">{fmtEur(Math.round(mensal))}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-[12px]">{fmtKE(c6)}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-[12px]">{fmtKE(c12)}</td>
                              <td className="px-2 py-1.5 text-right text-[11px] text-slate-300">—</td>
                            </tr>
                          );
                        };
                        return display.flatMap((r) => {
                          const out = [rowTr(r, false)];
                          if (r.level === 1 && plOpen.has(r.row_key)) {
                            childrenOf(r.row_key).forEach((l) => {
                              out.push(rowTr(l, true));
                              const cs = compsFor(l);
                              if (cs.length && plOpen.has(l.row_key)) cs.forEach((c) => out.push(compTr(l, c)));
                            });
                          }
                          return out;
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Mensal = média por mês no ano (€). Acumulados em k€.</p>
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
              <h3 className="font-semibold text-slate-800">Valor mensal</h3>
              <button onClick={() => setEditCell(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {editCell.label} · {editCell.series === 'budget' ? 'Orçamento' : 'Outlook'} · aplica a todos os meses do ano
            </p>
            <div className="flex items-center gap-2">
              <input type="number" autoFocus value={editCell.value}
                onChange={(e) => setEditCell({ ...editCell, value: e.target.value })}
                placeholder="(vazio = repor base)"
                className="flex-1 text-sm rounded-lg border border-slate-200 px-3 py-2 text-right tabular-nums" />
              <span className="text-sm text-slate-500">€/mês</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{editCell.series === 'budget' ? 'Define o orçamento mensal do ano.' : 'Aplica este valor a cada mês do ano. Vazio repõe o valor proposto pelo motor.'}</p>
            <button onClick={saveCell} disabled={busy === 'cell'}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50">
              {busy === 'cell' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Aplicar ao ano
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

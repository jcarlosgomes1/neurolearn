'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, TrendingUp, Wallet, AlertTriangle, Sliders, Table2,
  Sparkles, ChevronDown, ChevronUp, RefreshCw, Check, X, Flame, Target,
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

export function FinanceConsole({ locale }: { locale: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<'resumo' | 'pl' | 'canais' | 'agente'>('resumo');
  const [serie, setSerie] = useState<string>('outlook');
  const [openSection, setOpenSection] = useState<string | null>('revenue');
  const [cash, setCash] = useState<number>(50000);
  const [calibrate, setCalibrate] = useState<boolean>(false);
  const [draftParams, setDraftParams] = useState<Record<string, Record<string, number>>>({});

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

  // ---- derivados: periodos e P&L indexado ----
  const periods = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.pl.forEach((c) => set.add(c.period));
    return Array.from(set).sort();
  }, [data]);

  // mostrar marcos: 1, 6, 12, 18, 24 (ou os disponiveis)
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

  // totais por periodo para a serie selecionada
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

  // runway no mes corrente (primeiro periodo) usando outlook
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
      const { error } = await supabase.rpc('nl_sim_run_pl', {
        p_scenario_id: data.scenario_id, p_calibrate: calibrate,
      });
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

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (!data) {
    return <div className="text-center py-24 text-slate-500">Sem dados. <button onClick={() => load()} className="text-indigo-600 underline">Tentar de novo</button></div>;
  }

  const finalPeriod = periods[periods.length - 1];
  const finalNet = totals[finalPeriod]?.net ?? 0;
  const cumProfit = periods.reduce((s, p) => s + (totals[p]?.net ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* seletor de cenario + recalcular */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={data.scenario_id}
          onChange={(e) => load(e.target.value)}
          className="text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white min-w-0 flex-1"
        >
          {data.scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.is_baseline ? ' ★' : ''}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
          <input type="checkbox" checked={calibrate} onChange={(e) => setCalibrate(e.target.checked)} className="rounded" />
          Sinais reais
        </label>
        <button
          onClick={resimulate} disabled={busy === 'sim'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy === 'sim' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Recalcular
        </button>
      </div>

      {/* tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto -mx-4 px-4">
        {([['resumo', 'Resumo', Target], ['pl', 'P&L', Table2], ['canais', 'Canais', Sliders], ['agente', 'Agente', Sparkles]] as const).map(([k, lbl, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-4 w-4" />{lbl}
          </button>
        ))}
      </div>

      {/* ===== RESUMO ===== */}
      {tab === 'resumo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={TrendingUp} label="MRR final" value={fmtEur(totals[finalPeriod]?.rev ?? 0)} tone="indigo" />
            <Kpi icon={Wallet} label="Lucro acum. (horizonte)" value={fmtEur(cumProfit)} tone={cumProfit >= 0 ? 'emerald' : 'rose'} />
            <Kpi icon={Flame} label="Burn mensal (agora)" value={runway?.burn ? fmtEur(runway.burn) : '—'} tone={runway?.burn ? 'amber' : 'emerald'} />
            <Kpi icon={AlertTriangle} label="Runway"
              value={runway?.months != null ? `${runway.months.toFixed(1)} meses` : 'Lucrativo'}
              tone={runway?.months != null && runway.months < 6 ? 'rose' : 'emerald'} />
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
              </strong>. Ajusta os parâmetros nos Canais e recalcula para ver o impacto.
            </p>
          </div>

          {/* trajetoria por marcos */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-700">
              Trajetória ({SERIES.find((s) => s.key === serie)?.label})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs">
                    <th className="text-left font-medium px-4 py-2">Mês</th>
                    <th className="text-right font-medium px-3 py-2">Receita</th>
                    <th className="text-right font-medium px-3 py-2">Custo</th>
                    <th className="text-right font-medium px-4 py-2">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {milestoneMonths.map((p) => (
                    <tr key={p} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-600">{p}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmtEur(totals[p]?.rev ?? 0)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmtEur(totals[p]?.cost ?? 0)}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-medium ${(totals[p]?.net ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fmtEur(totals[p]?.net ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== P&L ===== */}
      {tab === 'pl' && (
        <div className="space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            {SERIES.map((s) => (
              <button key={s.key} onClick={() => setSerie(s.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${serie === s.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s.label}
              </button>
            ))}
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
                            {milestoneMonths.map((p) => (
                              <td key={p} className="px-3 py-2 text-right tabular-nums text-slate-700 whitespace-nowrap">
                                {fmtEur(val(l.line_key, p, serie))}
                              </td>
                            ))}
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

      {/* ===== CANAIS ===== */}
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
                      onChange={(e) => setDraftParams((prev) => ({
                        ...prev, [c.channel_key]: { ...prev[c.channel_key], [k]: Number(e.target.value) },
                      }))}
                      className="w-28 text-sm rounded-lg border border-slate-200 px-2 py-1 text-right tabular-nums" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 px-1">Os valores-base foram propostos automaticamente. Ajusta-os e usa "Recalcular" no topo para projetar o impacto.</p>
        </div>
      )}

      {/* ===== AGENTE ===== */}
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

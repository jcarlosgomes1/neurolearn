'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, RefreshCw, Users, UserCheck, CreditCard, TrendingUp, Cloud, Server, Building2, Info } from 'lucide-react';

type Demand = {
  final: { users_total: number; active_users: number; paying_users: number; mrr_eur: number };
  months: { month: string; new_signups: number; users_total: number; active: number; paying: number; mrr_eur: number }[];
  inputs: { baseline_visitors: number; agent_visitors: number; cr_visitor_signup: number; cr_active_paying: number; monthly_churn: number; arpu_eur: number };
  horizon_months: number;
};
type AreaRow = { area: string; total: number; tenant: number; platform: number };
type SvcRow = { service: string; name: string; area: string; total: number; tenant: number; platform: number };
type Cost = { total: number; tenant_total: number; platform_total: number; month: string; by_area: AreaRow[]; by_service: SvcRow[] };
type Payload = { ok: boolean; cost: Cost; demand: Demand; generated_at: string };

const AREA_PT: Record<string, string> = { ai: 'IA', search: 'Pesquisa', video: 'Vídeo', media: 'Media', email: 'Email', payments: 'Pagamentos', infra: 'Infraestrutura', comms: 'Comunicações' };
const eur = (n: number) => (n ?? 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const num = (n: number) => (n ?? 0).toLocaleString('pt-PT');

export function ForecastConsole() {
  const supabase = createClient();
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (h: number) => {
    setLoading(true);
    const { data: res, error } = await supabase.rpc('nl_admin_finance_forecast', { p_months: h });
    if (error) { console.error(error); setData(null); } else { setData(res as Payload); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(months); }, [load, months]);

  const d = data?.demand; const c = data?.cost;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Horizonte</span>
          {[3, 6, 12].map((h) => (
            <button key={h} onClick={() => setMonths(h)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${months === h ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'}`}>
              {h} meses
            </button>
          ))}
        </div>
        <button onClick={() => load(months)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-neutral-200 bg-white hover:border-neutral-300">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {loading && (<div className="flex items-center gap-2 text-neutral-500 py-12 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> A calcular previsão…</div>)}

      {!loading && d && c && (<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={<Users className="w-5 h-5" />} label={`Users (${d.horizon_months}m)`} value={num(d.final.users_total)} tone="neutral" />
          <Kpi icon={<UserCheck className="w-5 h-5" />} label="Ativos" value={num(d.final.active_users)} tone="blue" />
          <Kpi icon={<CreditCard className="w-5 h-5" />} label="Pagantes" value={num(d.final.paying_users)} tone="violet" />
          <Kpi icon={<TrendingUp className="w-5 h-5" />} label="MRR previsto" value={eur(d.final.mrr_eur)} tone="green" />
        </div>

        <Card title="Procura mês a mês" subtitle="Visitantes → registos → ativos → pagantes (com churn)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-neutral-500 border-b border-neutral-100">
                <th className="py-2 pr-3 font-medium">Mês</th><th className="py-2 px-3 font-medium text-right">Novos</th>
                <th className="py-2 px-3 font-medium text-right">Users</th><th className="py-2 px-3 font-medium text-right">Ativos</th>
                <th className="py-2 px-3 font-medium text-right">Pagantes</th><th className="py-2 pl-3 font-medium text-right">MRR</th>
              </tr></thead>
              <tbody>
                {d.months.map((m) => (
                  <tr key={m.month} className="border-b border-neutral-50">
                    <td className="py-2 pr-3 font-medium text-neutral-800">{m.month}</td>
                    <td className="py-2 px-3 text-right text-neutral-600">{num(m.new_signups)}</td>
                    <td className="py-2 px-3 text-right text-neutral-800">{num(m.users_total)}</td>
                    <td className="py-2 px-3 text-right text-neutral-600">{num(m.active)}</td>
                    <td className="py-2 px-3 text-right text-violet-700 font-medium">{num(m.paying)}</td>
                    <td className="py-2 pl-3 text-right text-green-700 font-medium">{eur(m.mrr_eur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Kpi icon={<Cloud className="w-5 h-5" />} label={`Custo externo / mês (${c.month})`} value={eur(c.total)} tone="amber" />
          <Kpi icon={<Building2 className="w-5 h-5" />} label="Custo tenants" value={eur(c.tenant_total)} tone="blue" />
          <Kpi icon={<Server className="w-5 h-5" />} label="Custo plataforma" value={eur(c.platform_total)} tone="neutral" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Custos por área" subtitle="Tenant vs plataforma">
            <CostTable rows={(c.by_area || []).map((a) => ({ k: AREA_PT[a.area] || a.area, total: a.total, tenant: a.tenant, platform: a.platform }))} />
          </Card>
          <Card title="Custos por serviço">
            <CostTable rows={(c.by_service || []).map((s) => ({ k: s.name, total: s.total, tenant: s.tenant, platform: s.platform }))} />
          </Card>
        </div>

        <Card title="Pressupostos do modelo" subtitle="Editáveis em Configuração da plataforma (demand_model_config)">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Assume label="Visitantes base/mês" value={num(d.inputs.baseline_visitors)} hint="ancorado na telemetria real (30d)" />
            <Assume label="Visitantes via agentes/mês" value={num(d.inputs.agent_visitors)} hint="atualizado pelo agente growth" />
            <Assume label="Conversão visita→registo" value={`${(d.inputs.cr_visitor_signup * 100).toFixed(1)}%`} />
            <Assume label="Conversão ativo→pagante" value={`${(d.inputs.cr_active_paying * 100).toFixed(1)}%`} />
            <Assume label="Churn mensal" value={`${(d.inputs.monthly_churn * 100).toFixed(1)}%`} />
            <Assume label="ARPU" value={eur(d.inputs.arpu_eur)} />
          </div>
          <p className="mt-3 text-xs text-neutral-500 flex items-start gap-1.5"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Valores estimados. Recalibram automaticamente à medida que a telemetria e as conversões reais crescem. Preços de serviços externos a confirmar.</p>
        </Card>
      </>)}

      {!loading && !data && (<div className="text-center text-neutral-500 py-12">Sem dados de previsão. <button onClick={() => load(months)} className="underline">Tentar de novo</button></div>)}
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  const tones: Record<string, string> = { neutral: 'text-neutral-700 bg-neutral-100', blue: 'text-blue-700 bg-blue-50', violet: 'text-violet-700 bg-violet-50', green: 'text-green-700 bg-green-50', amber: 'text-amber-700 bg-amber-50' };
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2 ${tones[tone] || tones.neutral}`}>{icon}</div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-xl font-semibold text-neutral-900 mt-0.5">{value}</div>
    </div>
  );
}
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-3"><h3 className="font-semibold text-neutral-900">{title}</h3>{subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}</div>
      {children}
    </div>
  );
}
function CostTable({ rows }: { rows: { k: string; total: number; tenant: number; platform: number }[] }) {
  if (!rows.length) return <p className="text-sm text-neutral-400">Sem custos projetados.</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="text-left text-neutral-500 border-b border-neutral-100">
        <th className="py-2 pr-3 font-medium">Item</th><th className="py-2 px-3 font-medium text-right">Total</th>
        <th className="py-2 px-3 font-medium text-right">Tenant</th><th className="py-2 pl-3 font-medium text-right">Plataforma</th>
      </tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={i} className="border-b border-neutral-50">
          <td className="py-2 pr-3 text-neutral-800">{r.k}</td>
          <td className="py-2 px-3 text-right font-medium text-neutral-900">{eur(r.total)}</td>
          <td className="py-2 px-3 text-right text-blue-700">{eur(r.tenant)}</td>
          <td className="py-2 pl-3 text-right text-neutral-500">{eur(r.platform)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}
function Assume({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-base font-semibold text-neutral-900 mt-0.5">{value}</div>
      {hint && <div className="text-[11px] text-neutral-400 mt-0.5">{hint}</div>}
    </div>
  );
}

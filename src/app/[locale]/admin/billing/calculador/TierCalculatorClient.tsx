'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Link } from '@/i18n/routing';
import { Calculator, TrendingUp, TrendingDown, ArrowLeft, RefreshCw } from 'lucide-react';

interface Tier {
  plan_id: string; plan_name: string; seats_typical: number;
  margin_target_pct: number; cost_per_seat_cents: number;
  price_suggested_per_seat_cents: number; price_current_per_seat_cents: number;
  delta_cents: number; unlimited: boolean; effective_margin_at_current_pct: number | null;
}
interface Calc { ok: boolean; currency: string; tiers: Tier[]; inputs: Record<string, number> }

function eur(c: number): string { return (c / 100).toFixed(2) + '€'; }

export function TierCalculatorClient() {
  const [calc, setCalc] = useState<Calc | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data } = await sb.rpc('nl_tier_calculator');
    setCalc(data as Calc);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <Link href={'/admin/billing' as any} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Billing</Link>
      <AdminPageHeader title="Calculador de Tiers" description="Custo real por seat, preço sugerido pela margem-alvo e margem efetiva ao preço atual. Tudo a partir da config — edita as margens e custos em Monetização." />

      <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
        <RefreshCw className={'h-3.5 w-3.5 ' + (loading ? 'animate-spin' : '')} /> Recalcular
      </button>

      {loading && <div className="text-sm text-slate-400 py-12 text-center">A calcular…</div>}

      {calc?.ok && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {calc.tiers.map((t) => {
              const below = t.effective_margin_at_current_pct != null && t.effective_margin_at_current_pct < t.margin_target_pct;
              return (
                <div key={t.plan_id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">{t.plan_name}</h3>
                    {t.unlimited ? <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">ilimitado</span>
                      : below ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700"><TrendingDown className="h-3 w-3" /> abaixo do alvo</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700"><TrendingUp className="h-3 w-3" /> no alvo</span>}
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <Row label="Custo real / seat" value={eur(t.cost_per_seat_cents)} sub={`${t.seats_typical} seats típicos`} />
                    <Row label="Margem-alvo" value={t.margin_target_pct + '%'} />
                    <div className="border-t border-slate-100 pt-2.5">
                      <Row label="Preço atual / seat" value={t.price_current_per_seat_cents > 0 ? eur(t.price_current_per_seat_cents) : '—'}
                        sub={t.effective_margin_at_current_pct != null ? `margem real ${t.effective_margin_at_current_pct}%` : 'negociado'}
                        subColor={below ? 'text-rose-600' : 'text-emerald-600'} />
                      <Row label="Preço sugerido / seat" value={eur(t.price_suggested_per_seat_cents)} strong
                        sub={t.delta_cents !== 0 && t.price_current_per_seat_cents > 0 ? `${t.delta_cents > 0 ? '+' : ''}${eur(t.delta_cents)}` : undefined}
                        subColor={t.delta_cents > 0 ? 'text-amber-600' : 'text-slate-400'} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5"><Calculator className="h-3.5 w-3.5" /> Parâmetros do cálculo</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Param label="IA incluída / seat" value={eur(calc.inputs.ai_included_per_seat_cents)} />
              <Param label="Storage / GB" value={eur(calc.inputs.storage_per_gb_cents)} />
              <Param label="Streaming / min" value={eur(calc.inputs.streaming_per_min_cents)} />
              <Param label="Overhead / seat" value={eur(calc.inputs.overhead_per_seat_cents)} />
            </div>
            <p className="text-xs text-slate-400 mt-3">Edita estes valores e as margens-alvo em <Link href={'/admin/monetizacao' as any} className="underline">Monetização</Link>. O agente receita propõe ajustes quando a margem real fica abaixo do alvo.</p>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, sub, subColor, strong }: { label: string; value: string; sub?: string; subColor?: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <div className="text-right">
        <div className={strong ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}>{value}</div>
        {sub && <div className={'text-[11px] ' + (subColor || 'text-slate-400')}>{sub}</div>}
      </div>
    </div>
  );
}
function Param({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-500 text-[11px]">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

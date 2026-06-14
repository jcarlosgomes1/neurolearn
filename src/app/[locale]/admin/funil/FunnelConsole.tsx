'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { FunnelChart, Sparkline, ForecastBar } from '@/components/admin/Charts';

const METRIC_META: Record<string, { label: string; color: string; money?: boolean }> = {
  new_students: { label: 'Novos alunos', color: '#6366f1' },
  course_completions: { label: 'Conclusões', color: '#10b981' },
  new_instructors: { label: 'Novos instrutores', color: '#8b5cf6' },
  active_users: { label: 'Utilizadores ativos', color: '#38bdf8' },
  revenue_cents: { label: 'Receita', color: '#f59e0b', money: true },
};

function fmtForecast(metric: string, v: number) {
  if (metric === 'revenue_cents') return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((v || 0) / 100);
  return String(Math.round((v || 0) * 10) / 10);
}

export function FunnelConsole() {
  const t = useTranslations();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_growth_analytics');
      if (error) throw error;
      if (!data?.ok) { setErr(data?.error || 'erro'); return; }
      setD(data); setErr(null);
    } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function recompute() {
    setBusy(true);
    try { const sb = createClient(); await sb.rpc('nl_growth_analytics_tick'); await load(); }
    catch { /* */ } finally { setBusy(false); }
  }

  function safeT(key: string, fb: string) {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  if (err) return <div className="p-6 text-sm text-rose-600">Erro: {err}</div>;
  if (!d) return <div className="p-6 text-sm text-slate-400">A carregar…</div>;

  const funnelData = (d.funnel || []).map((f: any) => ({
    label: safeT(f.label_key, f.stage), count: f.count, color: f.color, monetized: f.is_monetized,
  }));
  const students8w = (d.trends?.new_students_8w || []).map((x: any) => x.n);
  const completions8w = (d.trends?.completions_8w || []).map((x: any) => x.n);
  const events14d = (d.trends?.events_14d || []).map((x: any) => x.n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {d.computed_at ? `Atualizado ${new Date(d.computed_at).toLocaleString('pt-PT')}` : 'Sem cálculo ainda'}
        </p>
        <button onClick={recompute} disabled={busy} className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
          {busy ? '…' : 'Recalcular agora'}
        </button>
      </div>

      {/* Funil visual */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Funil de utilizadores</h2>
        <FunnelChart data={funnelData} />
      </section>

      {/* Previsões */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Previsões (próximos 30 dias)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(d.forecasts || []).map((f: any) => {
            const meta = METRIC_META[f.metric] || { label: f.metric, color: '#6366f1' };
            return (
              <div key={f.metric} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{meta.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${f.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : f.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {f.confidence === 'high' ? 'alta' : f.confidence === 'medium' ? 'média' : 'baixa'} conf.
                  </span>
                </div>
                <div className="text-2xl font-extrabold mt-1" style={{ color: meta.color }}>{fmtForecast(f.metric, f.forecast)}</div>
                <ForecastBar current={Number(f.current) || 0} forecast={Number(f.forecast) || 0} color={meta.color} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Tendências */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Tendências</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500 mb-1">Novos alunos · 8 semanas</div>
            <Sparkline points={students8w} color="#6366f1" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500 mb-1">Conclusões · 8 semanas</div>
            <Sparkline points={completions8w} color="#10b981" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500 mb-1">Eventos · 14 dias</div>
            <Sparkline points={events14d} color="#38bdf8" />
          </div>
        </div>
      </section>
    </div>
  );
}

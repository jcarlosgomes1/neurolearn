'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const SEGMENT_COLORS: Record<string, string> = {
  champion: '#10b981', loyal: '#6366f1', promising: '#8b5cf6',
  at_risk: '#f59e0b', hibernating: '#94a3b8', new: '#38bdf8',
};
const SEGMENT_LABELS: Record<string, string> = {
  champion: 'Campeões', loyal: 'Fiéis', promising: 'Promissores',
  at_risk: 'Em risco', hibernating: 'Hibernando', new: 'Novos',
};
const PRIORITY_STYLE: Record<string, string> = {
  high: 'border-rose-200 bg-rose-50', medium: 'border-amber-200 bg-amber-50', low: 'border-slate-200 bg-slate-50',
};
const KIND_EMOJI: Record<string, string> = {
  reactivation: '🔄', upsell_push: '💰', ad_channel: '📣', content_gap: '📚', pricing: '🏷️', retention: '🤝',
};

export function GrowthIntelligence({ data, onChange }: { data: any; onChange: () => void }) {
  const [busy, setBusy] = useState<number | null>(null);
  const seg = data.segments || [];
  const sc = data.scores || {};
  const actions = data.actions || [];
  const tickers = data.tickers || {};
  const totalSeg = seg.reduce((a: number, s: any) => a + s.n, 0) || 1;

  async function decide(id: number, decision: string) {
    setBusy(id);
    try { const sb = createClient(); await sb.rpc('nl_growth_action_decide', { p_id: id, p_decision: decision }); onChange(); }
    catch { /* */ } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6">
      {/* Scores preditivos */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Análise preditiva</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Leads quentes</div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-600">{sc.hot_leads ?? 0}</div>
            <div className="text-[11px] text-slate-400">propensão a comprar ≥50</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Em risco</div>
            <div className="text-2xl font-extrabold mt-1 text-amber-600">{sc.at_risk ?? 0}</div>
            <div className="text-[11px] text-slate-400">risco de abandono ≥55</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Lead score médio</div>
            <div className="text-2xl font-extrabold mt-1 text-slate-900">{sc.avg_lead ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Churn médio</div>
            <div className="text-2xl font-extrabold mt-1 text-slate-900">{sc.avg_churn ?? 0}</div>
          </div>
        </div>
      </section>

      {/* Previsão de vendas (pipeline) */}
      {data.pipeline && (
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Previsão de vendas — próximos 30 dias</h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${data.pipeline.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : data.pipeline.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              {data.pipeline.confidence === 'high' ? 'alta' : data.pipeline.confidence === 'medium' ? 'média' : 'baixa'} confiança
            </span>
          </div>
          <div className="text-3xl font-extrabold mt-2 text-amber-700">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((Number(data.pipeline.forecast_cents) || 0) / 100)}
          </div>
          {data.pipeline.basis && (
            <p className="text-xs text-slate-500 mt-1.5">
              Baseado em {data.pipeline.basis.hot_leads ?? 0} leads quentes, {data.pipeline.basis.warm_leads ?? 0} mornos e {data.pipeline.basis.cold_leads ?? 0} frios · ~{data.pipeline.basis.exp_conversions ?? 0} conversões esperadas · preço médio {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((Number(data.pipeline.basis.avg_price_cents) || 0) / 100)}
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">Estimativa por pipeline: leads reais × probabilidade de conversão × valor médio. Afina-se sozinha à medida que há mais dados.</p>
        </section>
      )}

      {/* Segmentos RFM */}
      {seg.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Segmentos de utilizadores</h2>
          <div className="flex h-4 rounded-full overflow-hidden mb-3">
            {seg.map((s: any) => (
              <div key={s.segment} style={{ width: `${(s.n / totalSeg) * 100}%`, background: SEGMENT_COLORS[s.segment] || '#cbd5e1' }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {seg.map((s: any) => (
              <span key={s.segment} className="text-xs flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: SEGMENT_COLORS[s.segment] || '#cbd5e1' }} />
                {SEGMENT_LABELS[s.segment] || s.segment} <b>{s.n}</b>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Propostas de ação */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Propostas de ação <span className="font-normal text-slate-400">— os agentes propõem, tu decides</span></h2>
        {actions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">Sem propostas neste momento. À medida que os dados crescem, aparecem aqui sugestões de reativação, upsell, canais de publicidade e lacunas de conteúdo.</div>
        ) : (
          <div className="space-y-3">
            {actions.map((a: any) => (
              <div key={a.id} className={`rounded-2xl border p-4 ${PRIORITY_STYLE[a.priority] || ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{KIND_EMOJI[a.kind] || '💡'}</span>
                      <span className="font-semibold text-slate-900 text-sm">{a.title}</span>
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/70 text-slate-500">{a.priority}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5">{a.rationale}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => decide(a.id, 'accepted')} disabled={busy === a.id} className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">Aceitar</button>
                  <button onClick={() => decide(a.id, 'dismissed')} disabled={busy === a.id} className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg disabled:opacity-50">Dispensar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tickers sociais */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Tickers sociais <span className="font-normal text-slate-400">— o mundo a ver os alunos crescer</span></h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Momentos no pool</div>
            <div className="text-2xl font-extrabold mt-1 text-fuchsia-600">{tickers.pending_moments ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Posts calendarizados</div>
            <div className="text-2xl font-extrabold mt-1 text-pink-600">{tickers.queued_posts ?? 0}</div>
          </div>
        </div>
        {(tickers.next || []).length > 0 && (
          <div className="space-y-2">
            {tickers.next.map((p: any, i: number) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm text-slate-700">{p.content}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                  <span className="capitalize">{p.platform}</span>·
                  <span>{p.status === 'pending_review' ? 'aguarda aprovação' : 'agendado'}</span>·
                  <span>{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString('pt-PT') : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

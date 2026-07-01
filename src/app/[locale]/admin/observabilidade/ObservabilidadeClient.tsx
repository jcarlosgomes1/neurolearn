'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Activity, DollarSign, Zap, Clock, AlertTriangle, TrendingUp, Search, Users, BookOpen, ExternalLink, ChevronRight } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';

interface AIStat {
  operation: string; model: string; calls: number;
  cost_cents: number; avg_duration_ms: number; success_rate: number;
  input_tokens_total: number; output_tokens_total: number; last_call_at: string;
}
interface AICall {
  id: number; operation: string; model: string; input_tokens: number; output_tokens: number;
  cost_cents: number; duration_ms: number; status: string; error_message: string | null;
  resource_type: string | null; resource_id: string | null; created_at: string;
}
interface KPI {
  snapshot_date: string; signups_today: number; enrollments_today: number;
  revenue_cents_today: number; signups_total: number; enrollments_total: number;
  revenue_cents_total: number; courses_published: number; active_jobs: number; failed_jobs_24h: number;
}
interface SeoSummary {
  total_pages: number; avg_score: number;
  excellent_count: number; good_count: number; needs_work_count: number; poor_count: number;
  by_page_type: any; last_audit_at: string | null;
}

export function ObservabilidadeClient({ hours, aiStats, aiRecent, kpis, seoSummary }: {
  hours: number; aiStats: AIStat[]; aiRecent: AICall[]; kpis: KPI[]; seoSummary: SeoSummary | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'ai' | 'kpi' | 'seo'>('ai');

  // AI aggregates
  const aiTotalCost = aiStats.reduce((acc, s) => acc + Number(s.cost_cents || 0), 0);
  const aiTotalCalls = aiStats.reduce((acc, s) => acc + Number(s.calls || 0), 0);
  const aiAvgSuccess = aiStats.length > 0
    ? aiStats.reduce((a, s) => a + Number(s.success_rate || 0), 0) / aiStats.length
    : 100;
  const aiAvgDuration = aiStats.length > 0
    ? aiStats.reduce((a, s) => a + Number(s.avg_duration_ms || 0), 0) / aiStats.length
    : 0;

  // KPI latest
  const latestKpi = kpis.length > 0 ? kpis[kpis.length - 1] : null;
  const previousKpi = kpis.length > 1 ? kpis[kpis.length - 2] : null;
  const signupsGrowth = latestKpi && previousKpi && previousKpi.signups_total > 0
    ? ((latestKpi.signups_total - previousKpi.signups_total) / previousKpi.signups_total) * 100
    : 0;

  function setHours(h: number) {
    router.push({ pathname: '/admin/observabilidade', query: { since: String(h) } } as any);
  }

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <Tabs
        items={[
          { k: 'ai', label: 'Custos automatizados', icon: Zap },
          { k: 'kpi', label: 'KPIs diários', icon: TrendingUp },
          { k: 'seo', label: 'SEO', icon: Search },
        ]}
        value={tab}
        onChange={(k) => setTab(k as typeof tab)}
      />

      {tab === 'ai' && (
        <>
          {/* Period filter */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-500 flex-shrink-0">Período:</span>
            {[{ h: 1, l: '1h' }, { h: 24, l: '24h' }, { h: 168, l: '7 dias' }, { h: 720, l: '30 dias' }].map((p) => (
              <button key={p.h} onClick={() => setHours(p.h)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${hours === p.h ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}>
                {p.l}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard icon={DollarSign} label="Custo total" value={`${(aiTotalCost / 100).toFixed(2)} €`}
              sub={`${aiTotalCalls} chamadas`} cls="from-emerald-500 to-teal-600" />
            <KPICard icon={Zap} label="Chamadas" value={aiTotalCalls.toLocaleString('pt-PT')}
              sub={`${aiStats.length} operações`} cls="from-violet-500 to-indigo-600" />
            <KPICard icon={AlertTriangle} label="Taxa sucesso" value={`${aiAvgSuccess.toFixed(1)}%`}
              sub={aiAvgSuccess < 95 ? 'Atenção' : 'Saudável'} cls={aiAvgSuccess < 95 ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600'} />
            <KPICard icon={Clock} label="Duração média" value={`${(aiAvgDuration / 1000).toFixed(2)}s`}
              sub="por chamada" cls="from-blue-500 to-cyan-600" />
          </div>

          {/* Stats por operation */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-600" />
              <h2 className="font-semibold text-sm text-slate-900">Por operação</h2>
            </header>
            {aiStats.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">Sem chamadas no período selecionado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="text-left px-4 py-2">Operação</th>
                      <th className="text-left px-4 py-2">Modelo</th>
                      <th className="text-right px-4 py-2">Calls</th>
                      <th className="text-right px-4 py-2">Custo</th>
                      <th className="text-right px-4 py-2">Avg ms</th>
                      <th className="text-right px-4 py-2">% Sucesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiStats.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2 font-semibold text-slate-900">{s.operation}</td>
                        <td className="px-4 py-2 text-xs"><code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{s.model}</code></td>
                        <td className="px-4 py-2 text-right">{Number(s.calls).toLocaleString('pt-PT')}</td>
                        <td className="px-4 py-2 text-right font-semibold">{(Number(s.cost_cents) / 100).toFixed(2)} €</td>
                        <td className="px-4 py-2 text-right text-slate-600">{Math.round(Number(s.avg_duration_ms))}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={`text-xs font-semibold ${Number(s.success_rate) >= 95 ? 'text-emerald-700' : Number(s.success_rate) >= 80 ? 'text-amber-700' : 'text-rose-700'}`}>
                            {Number(s.success_rate).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent calls */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <header className="px-5 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-sm text-slate-900">Últimas 50 chamadas</h2>
            </header>
            {aiRecent.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">Sem chamadas registadas.</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {aiRecent.map((c) => (
                  <div key={c.id} className="px-5 py-2.5 flex items-center gap-3 hover:bg-slate-50/40 text-xs">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${c.status === 'success' ? 'bg-emerald-500' : c.status === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <span className="font-mono text-[10px] text-slate-400 w-16 flex-shrink-0">{new Date(c.created_at).toLocaleTimeString('pt-PT')}</span>
                    <span className="font-semibold text-slate-900 min-w-0 truncate">{c.operation}</span>
                    <code className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex-shrink-0">{c.model}</code>
                    <span className="text-slate-500 flex-shrink-0">{c.input_tokens || 0}→{c.output_tokens || 0}</span>
                    <span className="text-slate-500 flex-shrink-0">{c.duration_ms}ms</span>
                    <span className="font-semibold text-slate-700 flex-shrink-0 w-14 text-right">{(Number(c.cost_cents) / 100).toFixed(3)}€</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'kpi' && (
        <>
          {latestKpi && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard icon={Users} label="Signups hoje" value={latestKpi.signups_today.toLocaleString('pt-PT')}
                sub={`${latestKpi.signups_total.toLocaleString('pt-PT')} total · ${signupsGrowth >= 0 ? '+' : ''}${signupsGrowth.toFixed(1)}%`}
                cls="from-violet-500 to-indigo-600" />
              <KPICard icon={BookOpen} label="Inscrições hoje" value={latestKpi.enrollments_today.toLocaleString('pt-PT')}
                sub={`${latestKpi.enrollments_total.toLocaleString('pt-PT')} total`}
                cls="from-emerald-500 to-teal-600" />
              <KPICard icon={DollarSign} label="Receita hoje" value={`${(latestKpi.revenue_cents_today / 100).toFixed(2)} €`}
                sub={`${(latestKpi.revenue_cents_total / 100).toLocaleString('pt-PT')} € total`}
                cls="from-amber-500 to-orange-600" />
              <KPICard icon={AlertTriangle} label="Jobs falhados" value={latestKpi.failed_jobs_24h.toString()}
                sub={`${latestKpi.active_jobs} activos`}
                cls={latestKpi.failed_jobs_24h > 5 ? 'from-rose-500 to-red-600' : 'from-slate-500 to-slate-600'} />
            </div>
          )}

          {/* Sparkline-style time series */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <header className="px-5 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-sm text-slate-900">Últimos 30 dias</h2>
            </header>
            {kpis.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">Sem snapshots KPI ainda. Snapshot diário ainda não corre? Verifica cron.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="text-left px-4 py-2">Data</th>
                      <th className="text-right px-4 py-2">Signups</th>
                      <th className="text-right px-4 py-2">Inscrições</th>
                      <th className="text-right px-4 py-2">Receita</th>
                      <th className="text-right px-4 py-2">Jobs activos</th>
                      <th className="text-right px-4 py-2">Falhados 24h</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...kpis].reverse().map((k) => (
                      <tr key={k.snapshot_date} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2 font-mono text-xs text-slate-700">{k.snapshot_date}</td>
                        <td className="px-4 py-2 text-right">+{k.signups_today}</td>
                        <td className="px-4 py-2 text-right">+{k.enrollments_today}</td>
                        <td className="px-4 py-2 text-right font-semibold">{(k.revenue_cents_today / 100).toFixed(2)} €</td>
                        <td className="px-4 py-2 text-right">{k.active_jobs}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={k.failed_jobs_24h > 5 ? 'text-rose-700 font-semibold' : 'text-slate-500'}>{k.failed_jobs_24h}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'seo' && (
        <>
          {!seoSummary || Number(seoSummary.total_pages) === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900">Sem auditorias SEO ainda</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">As auditorias automáticas correm em background. Verifica se o agente SEO está activo em /admin/agentes.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={Search} label="Páginas auditadas" value={Number(seoSummary.total_pages).toLocaleString('pt-PT')}
                  sub={seoSummary.last_audit_at ? `Última ${new Date(seoSummary.last_audit_at).toLocaleDateString('pt-PT')}` : '—'}
                  cls="from-violet-500 to-indigo-600" />
                <KPICard icon={TrendingUp} label="Score médio" value={Number(seoSummary.avg_score).toFixed(1)}
                  sub="0-100"
                  cls={Number(seoSummary.avg_score) >= 80 ? 'from-emerald-500 to-teal-600' : Number(seoSummary.avg_score) >= 60 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-red-600'} />
                <KPICard icon={AlertTriangle} label="Precisam trabalho" value={Number(seoSummary.needs_work_count).toString()}
                  sub={`${seoSummary.poor_count} críticas`}
                  cls="from-amber-500 to-orange-600" />
                <KPICard icon={Activity} label="Excelentes" value={Number(seoSummary.excellent_count).toString()}
                  sub={`${seoSummary.good_count} boas`}
                  cls="from-emerald-500 to-teal-600" />
              </div>
              {/* Por tipo página */}
              {seoSummary.by_page_type && (
                <section className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h2 className="font-semibold text-sm text-slate-900 mb-3">Por tipo de página</h2>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(seoSummary.by_page_type).map(([type, count]) => (
                      <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                        {type} <span className="bg-white px-1.5 rounded">{count as number}</span>
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}



function KPICard({ icon: Icon, label, value, sub, cls }: { icon: any; label: string; value: string; sub: string; cls: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${cls} text-white flex items-center justify-center shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

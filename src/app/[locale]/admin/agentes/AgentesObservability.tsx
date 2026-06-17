'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { relTime } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface AiCall { id: number; operation: string; model: string; input_tokens: number; output_tokens: number; cost_cents: number | null; duration_ms: number; status: string; error_message: string | null; resource_type: string | null; resource_id: string | null; created_at: string }
interface Job { id: string; job_type: string; status: string; progress_pct: number | null; progress_message: string | null; error_message: string | null; created_at: string; started_at: string | null; completed_at: string | null; retries: number; max_retries: number; payload: Record<string, unknown> | null }
interface Approval { id: string; action: string; reason: string | null; params: Record<string, unknown> | null; created_at: string; expires_at: string | null }
interface OpStat { operation: string; calls: number; success: number; errors: number; total_cents: number; avg_ms: number }

export function AgentesObservability() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [calls, setCalls] = useState<AiCall[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [period, setPeriod] = useState<'1h' | '24h' | '7d'>('24h');
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const periodMs = period === '1h' ? 3600_000 : period === '24h' ? 86400_000 : 604800_000;
    const since = new Date(Date.now() - periodMs).toISOString();
    const [{ data: c }, { data: j }, { data: ap }] = await Promise.all([
      supabase.from('nl_ai_calls').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(200),
      supabase.from('nl_agent_jobs').select('id, job_type, status, progress_pct, progress_message, error_message, created_at, started_at, completed_at, retries, max_retries, payload').gte('created_at', since).order('created_at', { ascending: false }).limit(100),
      supabase.from('nl_agent_approvals').select('id, action, reason, params, created_at, expires_at').eq('status', 'pending').order('created_at', { ascending: true }),
    ]);
    setCalls((c as AiCall[]) || []);
    setJobs((j as Job[]) || []);
    setApprovals((ap as Approval[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [period]);

  // Aggregate stats per operation
  const opStats: OpStat[] = useMemo(() => {
    const map: Record<string, OpStat> = {};
    for (const c of calls) {
      if (!map[c.operation]) map[c.operation] = { operation: c.operation, calls: 0, success: 0, errors: 0, total_cents: 0, avg_ms: 0 };
      const s = map[c.operation];
      s.calls += 1;
      if (c.status === 'success') s.success += 1; else s.errors += 1;
      s.total_cents += Number(c.cost_cents || 0);
      s.avg_ms = ((s.avg_ms * (s.calls - 1)) + (c.duration_ms || 0)) / s.calls;
    }
    return Object.values(map).sort((a, b) => b.total_cents - a.total_cents);
  }, [calls]);

  const totalCost = useMemo(() => calls.reduce((s, c) => s + Number(c.cost_cents || 0), 0), [calls]);
  const totalCalls = calls.length;
  const errorCount = calls.filter(c => c.status !== 'success').length;
  const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;

  const jobsByStatus = useMemo(() => {
    const m: Record<string, number> = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const j of jobs) m[j.status] = (m[j.status] || 0) + 1;
    return m;
  }, [jobs]);

  const recentFailures = useMemo(() => jobs.filter(j => j.status === 'failed').slice(0, 10), [jobs]);
  const activeJobs = useMemo(() => jobs.filter(j => ['running', 'pending'].includes(j.status)).slice(0, 10), [jobs]);

  async function decide(id: string, approve: boolean) {
    setBusyId(id);
    try {
      const { data, error } = await supabase.rpc('nl_admin_agent_approval_decide', { p_id: id, p_approve: approve });
      if (error || !(data as { ok: boolean }).ok) throw new Error();
      toast.success(approve ? 'Aprovado' : 'Rejeitado');
      setApprovals((xs) => xs.filter((x) => x.id !== id));
    } catch { toast.error('Falhou. Tenta novamente.'); }
    finally { setBusyId(null); }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <AdminPageHeader
        emoji="📡"
        title={t('agentes.title')}
        description={t('agentes.subtitle')}
        actions={
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {(['1h', '24h', '7d'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs px-3 py-1.5 rounded ${period === p ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {t(`agentes.period.${p}`)}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-slate-500">{t('candlist.loading')}</div>
      ) : (
        <>
          {/* High-level KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">{t('agentes.kpi.calls')}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{totalCalls}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">{t('agentes.kpi.cost')}</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{(totalCost / 100).toFixed(2)}€</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">{t('agentes.kpi.error_rate')}</div>
              <div className={`text-2xl font-bold mt-1 tabular-nums ${errorRate > 10 ? 'text-rose-600' : errorRate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{errorRate.toFixed(1)}%</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">{t('agentes.kpi.active_jobs')}</div>
              <div className="text-2xl font-bold text-brand-600 mt-1 tabular-nums">{jobsByStatus.running + jobsByStatus.pending}</div>
            </div>
          </div>

          {/* Aprovacoes pendentes — humano-no-loop */}
          <section className="bg-white border border-amber-200 rounded-xl p-4 sm:p-5">
            <h2 className="font-semibold text-slate-900 mb-1 text-sm flex items-center gap-2">🔐 Aprovações pendentes</h2>
            <p className="text-xs text-slate-500 mb-3">Decisões que os agentes pedem antes de agir.</p>
            {approvals.length === 0 ? (
              <p className="text-sm text-slate-400">Nada a aprovar — os agentes estão a operar dentro das permissões.</p>
            ) : (
              <ul className="space-y-2">
                {approvals.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs text-slate-900">{a.action}</div>
                      {a.reason && <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{a.reason}</div>}
                    </div>
                    <button onClick={() => decide(a.id, true)} disabled={busyId === a.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Aprovar</button>
                    <button onClick={() => decide(a.id, false)} disabled={busyId === a.id}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">Rejeitar</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Operations breakdown */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h2 className="font-semibold text-slate-900 mb-3 text-sm">{t('agentes.ops_title')}</h2>
            {opStats.length === 0 ? (
              <p className="text-sm text-slate-500">{t('agentes.no_calls')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="text-left py-2 pr-3 font-semibold">{t('agentes.col.op')}</th>
                      <th className="text-right pr-3 font-semibold">{t('agentes.col.calls')}</th>
                      <th className="text-right pr-3 font-semibold">{t('agentes.col.success_pct')}</th>
                      <th className="text-right pr-3 font-semibold">{t('agentes.col.avg_ms')}</th>
                      <th className="text-right font-semibold">{t('agentes.col.cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opStats.map((s) => {
                      const successPct = s.calls > 0 ? (s.success / s.calls) * 100 : 0;
                      return (
                        <tr key={s.operation} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-3 font-mono text-slate-900">{s.operation}</td>
                          <td className="pr-3 text-right tabular-nums">{s.calls}</td>
                          <td className={`pr-3 text-right tabular-nums ${successPct < 70 ? 'text-rose-600 font-semibold' : successPct < 95 ? 'text-amber-600' : 'text-emerald-600'}`}>{successPct.toFixed(0)}%</td>
                          <td className="pr-3 text-right text-slate-600 tabular-nums">{Math.round(s.avg_ms)}ms</td>
                          <td className="text-right tabular-nums font-medium">{(s.total_cents / 100).toFixed(4)}€</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Active / pending jobs */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h2 className="font-semibold text-slate-900 mb-3 text-sm">{t('agentes.active_jobs')}</h2>
            {activeJobs.length === 0 ? (
              <p className="text-sm text-slate-500">{t('agentes.no_active_jobs')}</p>
            ) : (
              <ul className="space-y-2">
                {activeJobs.map((j) => (
                  <li key={j.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${j.status === 'running' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs text-slate-900">{j.job_type}</div>
                      <div className="text-[11px] text-slate-500">{j.progress_message || t(`agentes.status.${j.status}`)} · {relTime(j.created_at)}</div>
                    </div>
                    <div className="text-xs tabular-nums text-slate-600">{j.progress_pct || 0}%</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent failures */}
          {recentFailures.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
              <h2 className="font-semibold text-slate-900 mb-3 text-sm">🚨 {t('agentes.recent_failures')}</h2>
              <ul className="space-y-2">
                {recentFailures.map((j) => (
                  <li key={j.id} className="py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-900">{j.job_type}</span>
                      <span className="text-[11px] text-slate-400">{relTime(j.created_at)}</span>
                    </div>
                    {j.error_message && <div className="text-[11px] text-rose-600 mt-1 line-clamp-2">{j.error_message}</div>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="text-xs text-slate-400 text-center pt-2">{t('agentes.tip')}</div>
        </>
      )}
    </div>
  );
}

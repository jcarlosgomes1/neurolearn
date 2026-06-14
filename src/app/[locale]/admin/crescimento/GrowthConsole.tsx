'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Overview = any;

function Stat({ label, value, sub, accent }: { label: string; value: any; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold mt-1 ${accent || 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function GrowthConsole() {
  const [d, setD] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_growth_overview');
      if (error) throw error;
      if (!data?.ok) { setErr(data?.error || 'erro'); return; }
      setD(data); setErr(null);
    } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function recompute() {
    setBusy(true);
    try {
      const sb = createClient();
      await sb.rpc('nl_growth_recompute_pending', { p_limit: 100 });
      await load();
    } catch { /* */ } finally { setBusy(false); }
  }

  if (err) return <div className="p-6 text-sm text-rose-600">Erro: {err}</div>;
  if (!d) return <div className="p-6 text-sm text-slate-400">A carregar…</div>;

  const ev = d.events, rx = d.reactions, re = d.recommendations, fn = d.funnel;
  const convRate = re.active + re.converted > 0 ? Math.round((re.converted / (re.active + re.converted)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Funil */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Funil de monetização</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Utilizadores" value={fn.total_users} accent="text-slate-900" />
          <Stat label="Ativos 7d" value={fn.active_7d} accent="text-brand-600" />
          <Stat label="Inscritos" value={fn.enrolled} accent="text-indigo-600" />
          <Stat label="Concluíram" value={fn.completed_course} accent="text-emerald-600" />
          <Stat label="Compradores" value={fn.buyers} accent="text-amber-600" />
        </div>
      </section>

      {/* Event spine */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Motor de eventos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Eventos (total)" value={ev.total} sub={`${ev.last_24h} nas últimas 24h`} />
          <Stat label="Eventos 7d" value={ev.last_7d} />
          <Stat label="Regras ativas" value={d.rules.enabled} sub={`${d.rules.total} no total`} />
          <Stat label="Reações" value={rx.done} sub={`${rx.pending} pendentes · ${rx.failed} falhas`} accent={rx.failed > 0 ? 'text-rose-600' : 'text-emerald-600'} />
        </div>
        {Array.isArray(ev.by_type) && ev.by_type.length > 0 && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Eventos por tipo</div>
            <div className="flex flex-wrap gap-2">
              {ev.by_type.map((t: any) => (
                <span key={t.type} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">{t.type} · <b>{t.n}</b></span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Recomendações */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700">Recomendações</h2>
          <button onClick={recompute} disabled={busy} className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {busy ? '…' : 'Recalcular agora'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Ativas" value={re.active} />
          <Stat label="Users com recos" value={re.users_with_recos} />
          <Stat label="Cliques" value={re.clicked} accent="text-indigo-600" />
          <Stat label="Convertidas" value={re.converted} accent="text-emerald-600" />
          <Stat label="Taxa conversão" value={`${convRate}%`} accent="text-amber-600" />
        </div>
        {Array.isArray(re.top_courses) && re.top_courses.length > 0 && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Cursos mais recomendados</div>
            <ul className="space-y-1.5">
              {re.top_courses.map((c: any) => (
                <li key={c.course_id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{c.title}</span>
                  <span className="text-slate-400 tabular-nums flex-shrink-0 ml-3">{c.n}×</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Regras + agente */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Regras event→reação</h2>
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
              <tr><th className="text-left px-4 py-2">Código</th><th className="text-left px-4 py-2">Evento</th><th className="text-left px-4 py-2">Reação</th><th className="text-left px-4 py-2">Estado</th></tr>
            </thead>
            <tbody>
              {(d.rules.list || []).map((r: any) => (
                <tr key={r.code} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-800">{r.code}</td>
                  <td className="px-4 py-2 text-slate-600">{r.event}</td>
                  <td className="px-4 py-2"><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{r.kind}</span></td>
                  <td className="px-4 py-2">{r.enabled ? <span className="text-emerald-600 text-xs font-semibold">ativa</span> : <span className="text-slate-400 text-xs">desligada</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {d.agent?.tasks && (
          <div className="mt-3 flex flex-wrap gap-2">
            {d.agent.tasks.map((t: any) => (
              <span key={t.key} className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg">🤖 {t.key} · {t.mode}{t.enabled ? '' : ' (off)'}</span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

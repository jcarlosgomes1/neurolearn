'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Loader2, Zap, Users, Bot } from 'lucide-react';

type Rule = {
  code: string; event_type: string; reaction_kind: string;
  agent: string | null; task_key: string | null; lane: string;
  sort_order: number; dedupe_window_hours: number; delay_minutes: number;
  enabled: boolean; done7d: number; pending: number;
};
type Arbiter = { window_hours?: number; max_per_window?: number };

export function AutomationsClient({ initialRules, initialArbiter }: { initialRules: Rule[]; initialArbiter: Arbiter }) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [arb, setArb] = useState<Arbiter>({ window_hours: initialArbiter?.window_hours ?? 24, max_per_window: initialArbiter?.max_per_window ?? 1 });
  const [saving, setSaving] = useState(false);
  const [savingArb, setSavingArb] = useState(false);

  function setField(code: string, field: keyof Rule, value: unknown) {
    setRules((rs) => rs.map((r) => (r.code === code ? { ...r, [field]: value } : r)));
    setDirty((d) => { const n = new Set(d); n.add(code); return n; });
  }

  async function saveRules() {
    if (dirty.size === 0) return;
    setSaving(true);
    const sb = createClient();
    let ok = 0; let fail = 0;
    for (const code of Array.from(dirty)) {
      const r = rules.find((x) => x.code === code);
      if (!r) continue;
      const { data, error } = await sb.rpc('nl_admin_event_subscription_set', {
        p_code: r.code, p_enabled: r.enabled, p_sort_order: r.sort_order, p_dedupe_window_hours: r.dedupe_window_hours,
      });
      if (error || (data && (data as { ok?: boolean }).ok === false)) fail++; else ok++;
    }
    setSaving(false);
    if (fail === 0) { toast.success(`Guardado (${ok})`); setDirty(new Set()); router.refresh(); }
    else toast.error(`${fail} falha(s), ${ok} ok`);
  }

  async function saveArbiter() {
    setSavingArb(true);
    const sb = createClient();
    const { error } = await sb.rpc('nl_admin_platform_config_set', {
      p_key: 'user_action_arbiter',
      p_value: JSON.stringify({ window_hours: Number(arb.window_hours) || 24, max_per_window: Number(arb.max_per_window) || 1 }),
      p_description: 'Arbitro de acoes ao utilizador: teto por utilizador/janela.',
    });
    setSavingArb(false);
    if (error) toast.error(error.message); else { toast.success('Árbitro guardado'); router.refresh(); }
  }

  const byEvent = rules.reduce((acc, r) => { (acc[r.event_type] ||= []).push(r); return acc; }, {} as Record<string, Rule[]>);
  const events = Object.keys(byEvent).sort();

  const laneBadge = (lane: string) => lane === 'user_facing'
    ? <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 border border-violet-200 text-violet-700 px-2 py-0.5 text-[11px] font-medium"><Users className="h-3 w-3" />utilizador</span>
    : <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 text-[11px] font-medium"><Bot className="h-3 w-3" />back-office</span>;

  const renderRow = (r: Rule) => (
    <div key={r.code} className="flex flex-wrap items-center gap-3 py-3">
      <div className="flex-1 min-w-[150px]">
        <div className="font-medium text-slate-900">{r.agent ? `${r.agent} · ${r.task_key}` : r.reaction_kind}</div>
        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">{r.code} {laneBadge(r.lane)}</div>
      </div>
      <div className="text-xs text-slate-500 whitespace-nowrap">7d <b className="text-slate-700">{r.done7d}</b> · pend {r.pending}</div>
      <label className="text-xs text-slate-500">prio
        <input type="number" value={r.sort_order} onChange={(e) => setField(r.code, 'sort_order', parseInt(e.target.value, 10) || 0)} className="ml-1 w-14 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-brand-500" />
      </label>
      <label className="text-xs text-slate-500">dedupe(h)
        <input type="number" value={r.dedupe_window_hours} onChange={(e) => setField(r.code, 'dedupe_window_hours', parseInt(e.target.value, 10) || 0)} className="ml-1 w-14 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-brand-500" />
      </label>
      <button type="button" onClick={() => setField(r.code, 'enabled', !r.enabled)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${r.enabled ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        {r.enabled ? 'Ativa' : 'Off'}
      </button>
    </div>
  );

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Árbitro de ações ao utilizador</h2>
        <p className="mt-1 text-sm text-slate-600">Evita spam: no máximo N ações (email/notificação/in-app) por utilizador numa janela de horas. Mantém a de maior prioridade.</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-sm text-slate-700">Máx. por janela
            <input type="number" value={arb.max_per_window ?? 1} onChange={(e) => setArb((a) => ({ ...a, max_per_window: parseInt(e.target.value, 10) || 0 }))} className="mt-1 block w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">Janela (horas)
            <input type="number" value={arb.window_hours ?? 24} onChange={(e) => setArb((a) => ({ ...a, window_hours: parseInt(e.target.value, 10) || 0 }))} className="mt-1 block w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <button type="button" onClick={saveArbiter} disabled={savingArb} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {savingArb ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Guardar árbitro
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {events.map((evt) => (
          <div key={evt} className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 py-2">
            <div className="py-2 font-semibold text-slate-900 font-mono text-sm border-b border-slate-100">{evt}</div>
            <div className="divide-y divide-slate-100">{byEvent[evt].map(renderRow)}</div>
          </div>
        ))}
        {events.length === 0 && <div className="text-sm text-slate-500">Sem subscrições.</div>}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" onClick={saveRules} disabled={saving || dirty.size === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-brand-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {dirty.size > 0 ? `Guardar (${dirty.size})` : 'Guardado'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, X, CheckCircle2 } from 'lucide-react';

interface Row { id: number; title: string; area: string; priority: string; status: string; detail: string | null; tested: boolean; backend_at: string | null; routes_at: string | null; ui_at: string | null; }

const COLS = [
  { key: 'todo', label: 'A Fazer', accent: 'from-slate-400 to-slate-500' },
  { key: 'doing', label: 'Em curso', accent: 'from-blue-500 to-indigo-600' },
  { key: 'blocked', label: 'Bloqueado', accent: 'from-rose-500 to-red-600' },
  { key: 'parked', label: 'Parado', accent: 'from-amber-500 to-orange-600' },
  { key: 'done', label: 'Concluído', accent: 'from-emerald-500 to-teal-600' },
];
const PRIOS = ['P0', 'P1', 'P2', 'P3'];
const PRIO_COLOR: Record<string, string> = { P0: 'bg-rose-100 text-rose-700', P1: 'bg-amber-100 text-amber-700', P2: 'bg-blue-100 text-blue-700', P3: 'bg-slate-100 text-slate-600' };

export function BacklogKanban() {
  const sb = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [prioFilter, setPrioFilter] = useState<string>('all');
  const [onlyUntested, setOnlyUntested] = useState(false);
  const [adding, setAdding] = useState(false);
  const [nt, setNt] = useState('');
  const [na, setNa] = useState('expose-ui');
  const [np, setNp] = useState('P2');

  async function load() {
    setLoading(true);
    const { data } = await sb.from('nl_backlog').select('*').order('priority').order('id');
    setRows((data || []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setTested(id: number, tested: boolean) {
    setRows((r) => r.map((x) => x.id === id ? { ...x, tested } : x));
    await sb.from('nl_backlog').update({ tested, tested_at: tested ? new Date().toISOString() : null }).eq('id', id);
  }
  async function setStatus(id: number, status: string) {
    setRows((r) => r.map((x) => x.id === id ? { ...x, status } : x));
    await sb.from('nl_backlog').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  }
  async function setPriority(id: number, priority: string) {
    setRows((r) => r.map((x) => x.id === id ? { ...x, priority } : x));
    await sb.from('nl_backlog').update({ priority, updated_at: new Date().toISOString() }).eq('id', id);
  }
  async function add() {
    if (!nt.trim()) return;
    const { data } = await sb.from('nl_backlog').insert({ title: nt.trim(), area: na.trim() || 'misc', priority: np, status: 'todo' }).select().single();
    if (data) setRows((r) => [...r, data as Row]);
    setNt(''); setAdding(false);
  }
  async function del(id: number) {
    setRows((r) => r.filter((x) => x.id !== id));
    await sb.from('nl_backlog').delete().eq('id', id);
  }

  const filtered = useMemo(() => rows.filter((r) =>
    (prioFilter === 'all' || r.priority === prioFilter) && (!onlyUntested || !r.tested)
  ), [rows, prioFilter, onlyUntested]);
  const byStatus = (s: string) => filtered.filter((r) => r.status === s);
  const untestedDone = rows.filter((r) => r.status === 'done' && !r.tested).length;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setPrioFilter('all')} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${prioFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Todas</button>
        {PRIOS.map((p) => <button key={p} onClick={() => setPrioFilter(p)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${prioFilter === p ? 'bg-slate-900 text-white' : PRIO_COLOR[p]}`}>{p}</button>)}
        <button onClick={() => setOnlyUntested((v) => !v)} className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 ${onlyUntested ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Por testar{untestedDone > 0 ? ' (' + untestedDone + ')' : ''}
        </button>
        <div className="flex-1" />
        <button onClick={() => setAdding((a) => !a)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center gap-1"><Plus className="h-3.5 w-3.5" />Novo</button>
      </div>

      {adding && (
        <div className="mb-4 p-3 rounded-xl border border-slate-200 bg-white flex flex-col gap-2 sm:flex-row sm:items-center">
          <input value={nt} onChange={(e) => setNt(e.target.value)} placeholder="Título da tarefa" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
          <input value={na} onChange={(e) => setNa(e.target.value)} placeholder="área" className="w-full sm:w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
          <select value={np} onChange={(e) => setNp(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm">{PRIOS.map((p) => <option key={p}>{p}</option>)}</select>
          <button onClick={add} className="rounded-lg bg-slate-900 text-white text-sm font-semibold px-4 py-2">Adicionar</button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLS.map((col) => {
          const items = byStatus(col.key);
          return (
            <div key={col.key} className="min-w-[280px] w-[280px] shrink-0">
              <div className={`rounded-t-xl px-3 py-2 bg-gradient-to-r ${col.accent} text-white flex items-center justify-between`}>
                <span className="font-bold text-sm">{col.label}</span>
                <span className="text-xs font-semibold bg-white/25 rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="space-y-2 p-2 bg-slate-100/60 rounded-b-xl min-h-[120px]">
                {items.map((it) => (
                  <div key={it.id} className={`bg-white rounded-xl border p-3 shadow-sm ${it.tested ? 'border-emerald-200' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIO_COLOR[it.priority] || ''}`}>{it.priority}</span>
                      <button onClick={() => del(it.id)} className="text-slate-300 hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-1 leading-snug">{it.title}</p>
                    {it.detail ? <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{it.detail}</p> : null}
                    <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wide">{it.area}</p>
                    <div className="flex gap-1 mt-2">{[{ k: 'BE', on: !!it.backend_at, t: 'Backend' }, { k: 'RT', on: !!it.routes_at, t: 'Rotas' }, { k: 'UI', on: !!it.ui_at, t: 'UI' }, { k: '✓', on: it.tested, t: 'Testado' }].map((s) => (<span key={s.k} title={s.t} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${s.on ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>{s.k}</span>))}</div>
                    <div className="flex gap-1 mt-2">
                      <select value={it.status} onChange={(e) => setStatus(it.id, e.target.value)} className="flex-1 text-[11px] rounded-lg border border-slate-200 px-1.5 py-1 bg-slate-50">
                        {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                      <select value={it.priority} onChange={(e) => setPriority(it.id, e.target.value)} className="text-[11px] rounded-lg border border-slate-200 px-1.5 py-1 bg-slate-50">
                        {PRIOS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setTested(it.id, !it.tested)} className={`w-full mt-2 text-[11px] font-semibold rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors ${it.tested ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {it.tested ? 'Testado' : 'Marcar testado'}
                    </button>
                  </div>
                ))}
                {items.length === 0 ? <p className="text-center text-[11px] text-slate-400 py-6">vazio</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

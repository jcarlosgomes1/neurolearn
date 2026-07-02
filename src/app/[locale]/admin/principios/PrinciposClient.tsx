'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { Plus, Trash2, Save, ListChecks } from 'lucide-react';

interface Mandate { n: number; t: string; d: string }

export function PrinciposClient({ initialMandates, initialHandoff }: { initialMandates: Mandate[]; initialHandoff: string }) {
  const [mandates, setMandates] = useState<Mandate[]>(initialMandates);
  const [handoff, setHandoff] = useState(initialHandoff);
  const [savingM, setSavingM] = useState(false);
  const [savingH, setSavingH] = useState(false);

  async function saveConfig(key: string, value: string) {
    const sb = createClient();
    return sb.from('nl_platform_config').upsert({ key, value, updated_at: new Date().toISOString() });
  }

  async function saveMandates() {
    setSavingM(true);
    try {
      const renumbered = mandates.map((m, i) => ({ ...m, n: i + 1 }));
      const { error } = await saveConfig('founder_mandates', JSON.stringify(renumbered));
      if (error) throw error;
      setMandates(renumbered);
      toast.success('Princípios guardados');
    } catch (e: any) { toast.error(e.message); } finally { setSavingM(false); }
  }

  async function saveHandoff() {
    setSavingH(true);
    try {
      const { error } = await saveConfig('session_handoff_current', handoff);
      if (error) throw error;
      toast.success('Ponto de situação guardado');
    } catch (e: any) { toast.error(e.message); } finally { setSavingH(false); }
  }

  function update(i: number, field: 't' | 'd', v: string) {
    setMandates((arr) => arr.map((m, idx) => idx === i ? { ...m, [field]: v } : m));
  }
  function remove(i: number) { setMandates((arr) => arr.filter((_, idx) => idx !== i)); }
  function add() { setMandates((arr) => [...arr, { n: arr.length + 1, t: '', d: '' }]); }

  return (
    <div className="space-y-8">
      {/* Mandamentos */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-slate-900">Mandamentos não-negociáveis</h2>
          <button onClick={saveMandates} disabled={savingM}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg disabled:opacity-50">
            <Save className="h-4 w-4" /> {savingM ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
        <div className="space-y-3">
          {mandates.map((m, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">{i + 1}</span>
                <div className="flex-1 min-w-0 space-y-2">
                  <input value={m.t} onChange={(e) => update(i, 't', e.target.value)} placeholder="Título"
                    className="w-full font-medium text-slate-900 border-0 border-b border-transparent focus:border-slate-300 focus:ring-0 px-0 py-0.5 bg-transparent" />
                  <textarea value={m.d} onChange={(e) => update(i, 'd', e.target.value)} placeholder="Descrição" rows={2}
                    className="w-full text-sm text-slate-600 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0 resize-y" />
                </div>
                <button onClick={() => remove(i)} className="text-slate-300 hover:text-rose-600 p-1 shrink-0" aria-label="Remover">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={add} className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <Plus className="h-4 w-4" /> Adicionar princípio
        </button>
      </section>

      {/* Handoff corrente */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-semibold text-slate-900">Ponto de situação corrente</h2>
          <button onClick={saveHandoff} disabled={savingH}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg disabled:opacity-50">
            <Save className="h-4 w-4" /> {savingH ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-3">O que está feito e o que vem a seguir. Fica aqui para dar continuidade entre sessões.</p>
        <textarea value={handoff} onChange={(e) => setHandoff(e.target.value)} rows={10}
          className="w-full text-sm text-slate-700 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 resize-y font-mono leading-relaxed" />
      </section>

      {/* Link ao backlog */}
      <Link href={'/admin/backlog' as any}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ListChecks className="h-4 w-4" /> Abrir o backlog completo
      </Link>
    </div>
  );
}

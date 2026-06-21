'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Lock, Unlock, ArrowDownUp } from 'lucide-react';
import { toast } from 'sonner';

interface Course { id: string; title: string; progression: string }

const GLOBAL_OPTS = [
  { v: 'sequential', label: 'Sequencial' },
  { v: 'free', label: 'Livre' },
];
const COURSE_OPTS = [
  { v: 'inherit', label: 'Herdar' },
  { v: 'sequential', label: 'Sequencial' },
  { v: 'free', label: 'Livre' },
];

export function ProgressionClient() {
  const [globalMode, setGlobalMode] = useState<string>('sequential');
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_progression_get');
      if (error) throw error;
      const r = data as { ok?: boolean; global_mode?: string; courses?: Course[] };
      if (!r?.ok) throw new Error('forbidden');
      setGlobalMode(r.global_mode || 'sequential');
      setCourses(r.courses || []);
    } catch {
      setCourses([]);
      toast.error('Sem acesso ou falha ao carregar.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setGlobal(mode: string) {
    if (mode === globalMode || busy) return;
    setBusy('global');
    const prev = globalMode;
    setGlobalMode(mode);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_progression_set_global', { p_mode: mode });
      if (error || !(data as { ok?: boolean })?.ok) throw new Error();
      toast.success('Modo global atualizado.');
    } catch { setGlobalMode(prev); toast.error('Não foi possível atualizar.'); }
    setBusy(null);
  }

  async function setCourse(id: string, mode: string) {
    if (busy) return;
    setBusy(id);
    const prev = courses;
    setCourses((cs) => (cs || []).map((c) => c.id === id ? { ...c, progression: mode } : c));
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_progression_set_course', { p_course_id: id, p_mode: mode });
      if (error || !(data as { ok?: boolean })?.ok) throw new Error();
      toast.success('Curso atualizado.');
    } catch { setCourses(prev); toast.error('Não foi possível atualizar.'); }
    setBusy(null);
  }

  const globalLabel = globalMode === 'sequential' ? 'Sequencial' : 'Livre';

  return (
    <div>
      <AdminPageHeader emoji="🔓" title="Progressão de aulas" description="Define se os alunos avançam livremente ou de forma sequencial (cada aula desbloqueia a seguinte). Aplica-se a toda a plataforma, com exceções por curso." />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pb-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownUp className="h-4 w-4 text-brand-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">Modo por omissão</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Usado por todos os cursos definidos como “Herdar”.</p>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {GLOBAL_OPTS.map((o) => (
              <button key={o.v} disabled={busy === 'global'} onClick={() => setGlobal(o.v)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${globalMode === o.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            {globalMode === 'sequential'
              ? <><Lock className="h-3.5 w-3.5" /> O aluno só desbloqueia a aula seguinte depois de concluir a anterior.</>
              : <><Unlock className="h-3.5 w-3.5" /> O aluno acede a qualquer aula, em qualquer ordem.</>}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <h2 className="font-display text-lg font-bold text-slate-900">Exceções por curso</h2>
            <p className="text-sm text-slate-500 mt-0.5">“Herdar” segue o modo por omissão ({globalLabel}).</p>
          </div>
          {courses === null ? (
            <div className="p-6 text-sm text-slate-400">A carregar…</div>
          ) : courses.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">Sem cursos.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {courses.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5">
                  <span className="text-sm font-medium text-slate-800 truncate">{c.title}</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 flex-shrink-0">
                    {COURSE_OPTS.map((o) => (
                      <button key={o.v} disabled={busy === c.id} onClick={() => setCourse(c.id, o.v)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${c.progression === o.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, X, Check, Wand2, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';

type Step = { id: string; ordem: number; fase: string; estado: string; artefacto: any | null; nota_rejeicao: string | null };
type Build = { id: string; title: string | null; status: string; fase_atual: number; gravavel: boolean };

function ArtifactView({ data }: { data: any }) {
  if (data == null) return null;
  if (Array.isArray(data)) {
    return (
      <ul className="space-y-1.5">
        {data.map((it, i) => (
          <li key={i} className="text-sm text-neutral-700">
            {typeof it === 'object' && it !== null
              ? <div className="rounded-lg bg-white border border-neutral-200 px-3 py-2"><ArtifactView data={it} /></div>
              : <div className="flex gap-2"><span className="text-neutral-300">·</span><span>{String(it)}</span></div>}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{k.replace(/_/g, ' ')}</div>
            <div className="text-sm text-neutral-700">
              {typeof v === 'object' && v !== null ? <ArtifactView data={v} /> : String(v)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-sm text-neutral-700">{String(data)}</span>;
}

const ESTADO: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-neutral-100 text-neutral-500' },
  gerado: { label: 'Gerado — aguarda OK', cls: 'bg-amber-50 text-amber-700' },
  aprovado: { label: 'Aprovado', cls: 'bg-emerald-50 text-emerald-700' },
  rejeitado: { label: 'Devolvido', cls: 'bg-rose-50 text-rose-700' },
};

export default function BuildCockpit({ suggestion, onClose, phaseLabel }: { suggestion: { id: string; title: string }; onClose: () => void; phaseLabel: (k: string) => string }) {
  const [loading, setLoading] = useState(true);
  const [build, setBuild] = useState<Build | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openArt, setOpenArt] = useState<string | null>(null);

  const loadSteps = useCallback(async (buildId: string) => {
    const sb = createClient();
    const { data } = await sb.from('nl_event_build_steps').select('id,ordem,fase,estado,artefacto,nota_rejeicao').eq('build_id', buildId).order('ordem');
    setSteps((data as Step[]) || []);
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: ex } = await sb.from('nl_event_builds').select('id,title,status,fase_atual,gravavel').eq('suggestion_id', suggestion.id).maybeSingle();
      let b = ex as Build | null;
      if (!b) {
        const { data, error } = await sb.rpc('nl_event_build_start', { p_suggestion_id: suggestion.id });
        if (error || !(data as any)?.ok) throw new Error('start');
        const { data: nb } = await sb.from('nl_event_builds').select('id,title,status,fase_atual,gravavel').eq('suggestion_id', suggestion.id).maybeSingle();
        b = nb as Build | null;
      }
      setBuild(b);
      if (b) await loadSteps(b.id);
    } catch { toast.error('Não foi possível abrir a construção.'); }
    finally { setLoading(false); }
  }, [suggestion.id, loadSteps]);

  useEffect(() => { init(); }, [init]);

  async function runStep(id: string) {
    setBusyId(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_build_step_run', { p_step_id: id });
      if (error || !(data as any)?.ok) throw new Error('run');
      if (build) await loadSteps(build.id);
      setOpenArt(id);
    } catch { toast.error('Falha ao gerar o artefacto.'); }
    finally { setBusyId(null); }
  }

  async function approveStep(id: string) {
    setBusyId(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_build_step_approve', { p_step_id: id });
      if (error || !(data as any)?.ok) throw new Error('approve');
      toast.success('Fase aprovada.');
      if (build) {
        await loadSteps(build.id);
        const { data: nb } = await sb.from('nl_event_builds').select('id,title,status,fase_atual,gravavel').eq('id', build.id).maybeSingle();
        setBuild(nb as Build);
      }
    } catch { toast.error('Falha ao aprovar.'); }
    finally { setBusyId(null); }
  }

  async function rejectStep(id: string) {
    const nota = (typeof window !== 'undefined' ? window.prompt('Nota para devolver (opcional):') : '') || null;
    setBusyId(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_event_build_step_reject', { p_step_id: id, p_nota: nota });
      if (error) throw error;
      if (build) await loadSteps(build.id);
    } catch { toast.error('Falha ao devolver.'); }
    finally { setBusyId(null); }
  }

  const total = steps.length;
  const done = steps.filter((s) => s.estado === 'aprovado').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 p-5 border-b border-neutral-100">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-violet-600">Construção do evento</div>
            <h3 className="font-semibold text-neutral-900 mt-0.5 leading-snug">{suggestion.title}</h3>
            {total > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 w-32 rounded-full bg-neutral-100 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
                <span className="text-xs text-neutral-400">{done}/{total} fases</span>
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-neutral-400 hover:text-neutral-700 shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
        ) : (
          <div className="overflow-y-auto p-4 space-y-2">
            {steps.map((s) => {
              const est = ESTADO[s.estado] || ESTADO.pendente;
              const isOpen = openArt === s.id;
              return (
                <div key={s.id} className="rounded-xl border border-neutral-200">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 text-xs font-bold flex items-center justify-center shrink-0">{s.ordem}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-neutral-800 text-sm">{phaseLabel(s.fase)}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${est.cls}`}>{est.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(s.estado === 'pendente' || s.estado === 'rejeitado') && (
                        <button onClick={() => runStep(s.id)} disabled={busyId === s.id} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 text-white px-2.5 py-1.5 text-xs font-medium hover:bg-violet-700 disabled:opacity-50">
                          {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Gerar
                        </button>
                      )}
                      {(s.estado === 'gerado' || s.estado === 'aprovado') && (
                        <button onClick={() => setOpenArt(isOpen ? null : s.id)} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs hover:border-neutral-300">{isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</button>
                      )}
                      {s.estado === 'gerado' && (
                        <>
                          <button onClick={() => rejectStep(s.id)} disabled={busyId === s.id} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 text-rose-700 px-2.5 py-1.5 text-xs font-medium hover:bg-rose-50 disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" /> Devolver</button>
                          <button onClick={() => approveStep(s.id)} disabled={busyId === s.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">{busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Aprovar</button>
                        </>
                      )}
                      {s.estado === 'aprovado' && <span className="inline-flex items-center text-emerald-600"><Check className="w-4 h-4" /></span>}
                    </div>
                  </div>
                  {s.nota_rejeicao && s.estado === 'rejeitado' && <div className="px-4 pb-2 text-xs text-rose-600">Nota: {s.nota_rejeicao}</div>}
                  {isOpen && s.artefacto && <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50/50"><ArtifactView data={s.artefacto} /></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

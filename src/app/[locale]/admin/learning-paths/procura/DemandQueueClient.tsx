'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Users, GraduationCap, Sparkles, X, Loader2, Inbox, Check, ArrowRight, Route } from 'lucide-react';
import { SkeletonCard } from '@/components/shared/LoadingSkeleton';

interface Instructor { instructor_id: string; name: string | null; note: string | null; status: string; at: string }
interface Gap {
  gap_id: string; title: string; level: string | null; status: string;
  path_title: string | null; path_slug: string | null;
  preenroll_count: number; interested_instructors: Instructor[];
}
interface Placement {
  id: string; course_id: string; course_title: string | null; course_emoji: string | null;
  path_id: string; path_title: string | null; path_emoji: string | null;
  suggested_position: number | null; rationale: string | null; fit_score: number | null; status: string;
}

export function DemandQueueClient() {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const sb = createClient();
      const [demandRes, placeRes] = await Promise.all([
        sb.rpc('nl_admin_gap_demand_overview'),
        sb.rpc('nl_admin_path_placements_list'),
      ]);
      setGaps(((demandRes.data as { gaps?: Gap[] })?.gaps) || []);
      setPlacements(((placeRes.data as { proposals?: Placement[] })?.proposals) || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function dropGap(id: string) { setGaps((xs) => xs.filter((g) => g.gap_id !== id)); }
  function dropPlace(id: string) { setPlacements((xs) => xs.filter((p) => p.id !== id)); }

  async function generateAI(g: Gap) {
    setBusy(g.gap_id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_gap_generate_ai', { p_gap_id: g.gap_id });
      if (error || !(data as { ok: boolean }).ok) throw new Error();
      toast.success('Formação enviada para geração por IA'); dropGap(g.gap_id);
    } catch { toast.error('Falhou. Tenta novamente.'); }
    finally { setBusy(null); }
  }
  async function assign(g: Gap, instructorId: string) {
    setBusy(g.gap_id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_gap_assign_instructor', { p_gap_id: g.gap_id, p_instructor_id: instructorId });
      if (error || !(data as { ok: boolean }).ok) throw new Error();
      toast.success('Formação atribuída ao instrutor'); dropGap(g.gap_id);
    } catch { toast.error('Falhou. Tenta novamente.'); }
    finally { setBusy(null); }
  }
  async function rejectGap(g: Gap) {
    setBusy(g.gap_id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_path_gap_decide', { p_id: g.gap_id, p_decision: 'rejected' });
      if (error) throw error; dropGap(g.gap_id);
    } catch { toast.error('Falhou. Tenta novamente.'); }
    finally { setBusy(null); }
  }
  async function decidePlacement(p: Placement, accept: boolean) {
    setBusy(p.id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_path_placement_decide', { p_id: p.id, p_accept: accept });
      if (error || !(data as { ok: boolean }).ok) throw new Error();
      toast.success(accept ? 'Curso adicionado ao percurso' : 'Proposta rejeitada'); dropPlace(p.id);
    } catch { toast.error('Falhou. Tenta novamente.'); }
    finally { setBusy(null); }
  }

  if (loading) return <div className="grid sm:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>;

  const empty = gaps.length === 0 && placements.length === 0;
  if (empty) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 mb-1">Nada pendente</h3>
        <p className="text-sm text-slate-500">Lacunas com procura e propostas de encaixe aparecem aqui para decisão.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* PROPOSTAS DE ENCAIXE (curso existente -> percurso) */}
      {placements.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><Route className="h-5 w-5 text-indigo-600" /> Propostas de encaixe</h2>
          <p className="text-sm text-slate-500 mb-4">Cursos aprovados que podem entrar num percurso existente.</p>
          <div className="grid lg:grid-cols-2 gap-3">
            {placements.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">{p.course_emoji || '📘'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 min-w-0">
                    <span className="truncate">{p.course_title}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate text-indigo-700">{p.path_emoji} {p.path_title}</span>
                  </div>
                  {p.rationale && <div className="text-xs text-slate-500 truncate">{p.rationale}</div>}
                </div>
                <button onClick={() => decidePlacement(p, true)} disabled={busy === p.id}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                  {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Aceitar
                </button>
                <button onClick={() => decidePlacement(p, false)} disabled={busy === p.id}
                  className="flex-shrink-0 inline-flex items-center text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 disabled:opacity-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PROCURA (lacunas) */}
      {gaps.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><Users className="h-5 w-5 text-fuchsia-600" /> Procura por novas formações</h2>
          <p className="text-sm text-slate-500 mb-4">Lacunas de percursos com pré-inscrições e instrutores candidatos.</p>
          <div className="grid lg:grid-cols-2 gap-4">
            {gaps.map((g) => {
              const isBusy = busy === g.gap_id;
              return (
                <div key={g.gap_id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 leading-tight">{g.title}</h3>
                    {g.level && <span className="text-[10px] uppercase font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded flex-shrink-0">{g.level}</span>}
                  </div>
                  {g.path_title && <div className="text-xs text-slate-500 mb-3">Percurso: <span className="font-medium text-slate-700">{g.path_title}</span></div>}
                  <div className="flex items-center gap-3 mb-3 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 text-fuchsia-700 px-2.5 py-1 font-medium">
                      <Users className="h-3.5 w-3.5" /> {g.preenroll_count} pré-inscritos
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <GraduationCap className="h-3.5 w-3.5" /> {g.interested_instructors.length} instrutores
                    </span>
                  </div>
                  {g.interested_instructors.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {g.interested_instructors.map((ins) => (
                        <div key={ins.instructor_id} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{ins.name || 'Instrutor'}</div>
                            {ins.note && <div className="text-xs text-slate-500 line-clamp-2">{ins.note}</div>}
                          </div>
                          <button onClick={() => assign(g, ins.instructor_id)} disabled={isBusy}
                            className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GraduationCap className="h-3.5 w-3.5" />} Atribuir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button onClick={() => generateAI(g)} disabled={isBusy}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar por IA
                    </button>
                    <button onClick={() => rejectGap(g)} disabled={isBusy}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 px-2.5 py-2 rounded-lg hover:bg-rose-50 disabled:opacity-50">
                      <X className="h-4 w-4" /> Rejeitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

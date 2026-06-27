'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, X, Check, Wand2, RotateCcw, ChevronDown, ChevronRight, Globe, ExternalLink, CalendarClock, Video, AlertCircle, Sparkles } from 'lucide-react';

type Step = { id: string; ordem: number; fase: string; estado: string; artefacto: any | null; nota_rejeicao: string | null };
type Build = {
  id: string; title: string | null; status: string; fase_atual: number; gravavel: boolean; slug: string | null; published: boolean;
  event_at: string | null; event_timezone: string | null; duration_min: number | null;
  room_provider: string | null; room_url: string | null; room_status: string;
  schedule_proposal: any | null; scheduled_at: string | null; idioma_oficial: string | null;
};
type Act = { status: string; blocker: string | null };

const SEL = 'id,title,status,fase_atual,gravavel,slug,published,event_at,event_timezone,duration_min,room_provider,room_url,room_status,schedule_proposal,scheduled_at,idioma_oficial';

const BLOCKER_PT: Record<string, string> = {
  evento_sem_data: 'aguarda agendamento',
  resend_domain: 'requer domínio de email (#87)',
  mux_pipeline: 'requer gravação Mux (#258)',
  fase_c: 'convites externos (Fase C)',
  handler_pendente: 'execução por construir',
};

function toLocalInput(iso: string | null, tz: string | null): string {
  if (!iso) return '';
  try {
    const s = new Date(iso).toLocaleString('sv-SE', { timeZone: tz || 'Europe/Lisbon' });
    return s.replace(' ', 'T').slice(0, 16);
  } catch { return ''; }
}
function fmtWhen(iso: string | null, tz: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'full', timeStyle: 'short', timeZone: tz || 'Europe/Lisbon' }); }
  catch { return iso; }
}

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
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [build, setBuild] = useState<Build | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [acts, setActs] = useState<Record<string, Act>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openArt, setOpenArt] = useState<string | null>(null);
  const [pubBusy, setPubBusy] = useState(false);
  const [schedBusy, setSchedBusy] = useState(false);
  const [whenInput, setWhenInput] = useState('');
  const [provInput, setProvInput] = useState('daily');
  const [idiomaBusy, setIdiomaBusy] = useState(false);

  const loadSteps = useCallback(async (buildId: string) => {
    const sb = createClient();
    const { data } = await sb.from('nl_event_build_steps').select('id,ordem,fase,estado,artefacto,nota_rejeicao').eq('build_id', buildId).order('ordem');
    setSteps((data as Step[]) || []);
  }, []);

  const loadActs = useCallback(async (buildId: string) => {
    const sb = createClient();
    const { data } = await sb.from('nl_event_activations').select('fase,status,blocker').eq('build_id', buildId);
    const m: Record<string, Act> = {};
    (data || []).forEach((a: any) => { m[a.fase] = { status: a.status, blocker: a.blocker }; });
    setActs(m);
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: ex } = await sb.from('nl_event_builds').select(SEL).eq('suggestion_id', suggestion.id).maybeSingle();
      let b = ex as Build | null;
      if (!b) {
        const { data, error } = await sb.rpc('nl_event_build_start', { p_suggestion_id: suggestion.id });
        if (error || !(data as any)?.ok) throw new Error('start');
        const { data: nb } = await sb.from('nl_event_builds').select(SEL).eq('suggestion_id', suggestion.id).maybeSingle();
        b = nb as Build | null;
      }
      setBuild(b);
      if (b) { await loadSteps(b.id); await loadActs(b.id); }
    } catch { toast.error('Não foi possível abrir a construção.'); }
    finally { setLoading(false); }
  }, [suggestion.id, loadSteps, loadActs]);

  useEffect(() => { init(); }, [init]);

  // sincroniza o formulário de agendamento com a data/proposta do build
  useEffect(() => {
    if (!build) return;
    const tz = build.event_timezone || build.schedule_proposal?.timezone || 'Europe/Lisbon';
    if (build.event_at) {
      setWhenInput(toLocalInput(build.event_at, tz));
      setProvInput(build.room_provider || 'daily');
    } else if (build.schedule_proposal?.event_at) {
      setWhenInput(toLocalInput(build.schedule_proposal.event_at, tz));
      setProvInput(build.schedule_proposal.provider || 'daily');
    }
  }, [build]);

  async function refreshBuild() {
    if (!build) return;
    const sb = createClient();
    const { data: nb } = await sb.from('nl_event_builds').select(SEL).eq('id', build.id).maybeSingle();
    setBuild(nb as Build);
  }

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
      const act = (data as any)?.activation;
      if (act?.status === 'ativo' && act?.result?.posts_created != null) toast.success(`Fase aprovada · ${act.result.posts_created} publicações agendadas.`);
      else if (act?.status === 'pendente') toast.success(`Fase aprovada · ativação pendente (${BLOCKER_PT[act.blocker] || act.blocker}).`);
      else toast.success('Fase aprovada.');
      if (build) { await loadSteps(build.id); await loadActs(build.id); await refreshBuild(); }
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

  async function publish() {
    if (!build) return;
    setPubBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_build_publish', { p_build_id: build.id });
      if (error || !(data as any)?.ok) throw new Error('pub');
      await refreshBuild();
      toast.success('Página publicada.');
    } catch { toast.error('Aprova as fases Página e Inscrição primeiro.'); }
    finally { setPubBusy(false); }
  }

  async function unpublish() {
    if (!build) return;
    setPubBusy(true);
    try {
      const sb = createClient();
      await sb.rpc('nl_event_build_unpublish', { p_build_id: build.id });
      await refreshBuild();
    } catch { /* noop */ }
    finally { setPubBusy(false); }
  }

  async function proposeSchedule() {
    if (!build) return;
    setSchedBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_build_propose_schedule', { p_build_id: build.id });
      if (error || !(data as any)?.ok) throw new Error('propose');
      await refreshBuild();
    } catch { toast.error('Falha ao propor data.'); }
    finally { setSchedBusy(false); }
  }

  async function provisionRoom() {
    if (!build) return;
    try {
      const sb = createClient();
      await sb.functions.invoke('event-schedule', { body: { build_id: build.id } });
    } catch { /* writeback é lido no refresh */ }
  }

  async function confirmSchedule() {
    if (!build || !whenInput) return;
    setSchedBusy(true);
    try {
      const sb = createClient();
      const tz = build.event_timezone || build.schedule_proposal?.timezone || 'Europe/Lisbon';
      const dur = build.duration_min || build.schedule_proposal?.duration_min || 60;
      const { data, error } = await sb.rpc('nl_event_build_schedule_set_wall', {
        p_build_id: build.id, p_wall: whenInput, p_timezone: tz, p_duration_min: dur, p_provider: provInput,
      });
      if (error || !(data as any)?.ok) throw new Error('set');
      if (provInput === 'daily') await provisionRoom();
      await refreshBuild(); await loadActs(build.id);
      toast.success('Evento materializado.');
    } catch { toast.error('Falha ao materializar o evento.'); }
    finally { setSchedBusy(false); }
  }

  const total = steps.length;
  const done = steps.filter((s) => s.estado === 'aprovado').length;
  const pagOk = steps.some((s) => s.fase === 'pagina' && s.estado === 'aprovado');
  const insOk = steps.some((s) => s.fase === 'inscricao' && s.estado === 'aprovado');

  async function setIdioma(l: string) {
    if (!build || idiomaBusy) return;
    setIdiomaBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_build_set_idioma', { p_build_id: build.id, p_idioma: l });
      if (error || !(data as any)?.ok) throw new Error();
      await refreshBuild();
      toast.success('Idioma do evento atualizado.');
    } catch { toast.error('Falha ao atualizar o idioma.'); }
    finally { setIdiomaBusy(false); }
  }

  function ActBadge({ fase }: { fase: string }) {
    const a = acts[fase];
    if (!a || a.status === 'ignorado') return null;
    if (a.status === 'ativo') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Ativo</span>;
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">Pendente · {BLOCKER_PT[a.blocker || ''] || 'aguarda'}</span>;
  }

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
          <div className="overflow-y-auto p-4 space-y-2 flex-1">
            {steps.map((s) => {
              const est = ESTADO[s.estado] || ESTADO.pendente;
              const isOpen = openArt === s.id;
              return (
                <div key={s.id} className="rounded-xl border border-neutral-200">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 text-xs font-bold flex items-center justify-center shrink-0">{s.ordem}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-neutral-800 text-sm">{phaseLabel(s.fase)}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${est.cls}`}>{est.label}</span>
                        <ActBadge fase={s.fase} />
                      </div>
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

        {!loading && build && (
          <div className="border-t border-neutral-100 p-4 bg-white space-y-3">
            {/* Idioma oficial do evento */}
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Idioma oficial</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([['pt', 'Português'], ['en', 'English'], ['es', 'Español'], ['fr', 'Français']] as const).map(([code, label]) => {
                  const active = (build.idioma_oficial || 'pt') === code;
                  return (
                    <button key={code} onClick={() => setIdioma(code)} disabled={idiomaBusy} className={`px-2.5 py-1 text-xs rounded-full border transition-colors disabled:opacity-50 ${active ? 'bg-violet-600 text-white border-violet-600' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}>{label}</button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-400">Comanda o selo no repositório e a língua da divulgação.</p>
            </div>

            {/* Agendamento / materialização do evento */}
            <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CalendarClock className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700">Agendar evento</span>
              </div>

              {!build.event_at && !build.schedule_proposal && (
                <button onClick={proposeSchedule} disabled={schedBusy} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 text-white px-3 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                  {schedBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Propor data
                </button>
              )}

              {(build.event_at || build.schedule_proposal) && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Data e hora</span>
                      <input type="datetime-local" value={whenInput} onChange={(e) => setWhenInput(e.target.value)} className="mt-0.5 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Plataforma</span>
                      <select value={provInput} onChange={(e) => setProvInput(e.target.value)} className="mt-0.5 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm bg-white">
                        <option value="daily">Daily (interativo)</option>
                        <option value="mux">Mux (difusão)</option>
                        <option value="presencial">Presencial</option>
                      </select>
                    </label>
                  </div>
                  {provInput === 'mux' && <div className="text-[11px] text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Mux pendente do pipeline #258.</div>}
                  <button onClick={confirmSchedule} disabled={schedBusy || !whenInput} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                    {schedBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {build.event_at ? 'Atualizar agendamento' : 'Confirmar e materializar'}
                  </button>

                  {build.event_at && (
                    <div className="pt-1 border-t border-violet-100 space-y-1">
                      <div className="text-xs text-neutral-600">{fmtWhen(build.event_at, build.event_timezone)}</div>
                      {build.room_provider === 'daily' && build.room_status === 'ready' && build.room_url && (
                        <a href={build.room_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"><Video className="w-3.5 h-3.5" /> Abrir sala</a>
                      )}
                      {build.room_provider === 'daily' && build.room_status === 'pending' && (
                        <button onClick={async () => { setSchedBusy(true); await provisionRoom(); await refreshBuild(); setSchedBusy(false); }} disabled={schedBusy} className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline disabled:opacity-50">{schedBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />} Criar sala</button>
                      )}
                      {build.room_status === 'failed' && (
                        <button onClick={async () => { setSchedBusy(true); await provisionRoom(); await refreshBuild(); setSchedBusy(false); }} className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"><RotateCcw className="w-3.5 h-3.5" /> Falha na sala — repetir</button>
                      )}
                      {build.room_provider === 'mux' && <div className="text-[11px] text-amber-600">Sala Mux pendente (#258).</div>}
                      {build.room_provider === 'presencial' && <div className="text-[11px] text-neutral-400">Evento presencial — sem sala online.</div>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Publicação da página pública */}
            {build.published && build.slug ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-emerald-700">Página publicada</div>
                  <a href={`/${locale}/evento/${build.slug}`} target="_blank" rel="noreferrer" className="text-xs text-violet-600 hover:underline inline-flex items-center gap-1 truncate"><ExternalLink className="w-3 h-3 shrink-0" /> /evento/{build.slug}</a>
                </div>
                <button onClick={unpublish} disabled={pubBusy} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:border-neutral-300 disabled:opacity-50 shrink-0">Despublicar</button>
              </div>
            ) : (pagOk && insOk) ? (
              <button onClick={publish} disabled={pubBusy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">{pubBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Publicar página pública</button>
            ) : (
              <div className="text-xs text-neutral-400 text-center">Aprova as fases <b>Página</b> e <b>Inscrição</b> para publicar a página pública.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

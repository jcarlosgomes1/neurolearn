'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Wand2, Check, UserPlus, Send, Users, Sparkles, Calendar, FileText, X, Layers } from 'lucide-react';
import BuildCockpit from './BuildCockpit';

type Suggestion = { id: string; title: string; description: string | null; rationale: string | null; suggested_kind: string; topic: string | null; audience: string | null; score: number; status: string; created_session_id: string | null; plan: any | null; plan_at?: string | null };
type EventMin = { id: string; title: string; session_kind: string; published?: boolean };
type Candidate = { id: string; user_id: string | null; email: string | null; name: string; source: string; match_reason: string | null; score: number; status: string };

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">{label}</div>
      <div className="text-sm text-neutral-700 leading-relaxed">{children}</div>
    </div>
  );
}
function Chips({ items }: { items: any[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.filter(Boolean).map((it, i) => (
        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{String(it)}</span>
      ))}
    </div>
  );
}

function PlanModal({ s, accepting, onAccept, onClose, kindLabel }: { s: Suggestion; accepting: boolean; onAccept: () => void; onClose: () => void; kindLabel: (k: string) => string }) {
  const p = s.plan || {};
  const est = p.estrutura || {};
  const mer = p.mercado || {};
  const div = p.divulgacao || {};
  const con = p.convidados || {};
  const cap = p.captura || {};
  const kpis = p.kpis || {};
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 p-5 border-b border-neutral-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{kindLabel(s.suggested_kind)}</span>
              {typeof mer.aceitacao_score === 'number' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Aceitação {mer.aceitacao_score}/100</span>
              )}
            </div>
            <h3 className="font-semibold text-neutral-900 mt-1.5 leading-snug">{s.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-neutral-400 hover:text-neutral-700 shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {(() => { const k = (s.plan && s.plan.kpis) || {}; const ins = Number(k.meta_inscritos) || 0; const conv = Number(k.meta_conversao_pct) || 0; const ticket = Number(String(k.meta_ticket_medio || "").replace(/[^0-9.,]/g, "").replace(",", ".")) || 0; const rev = Math.round(ins * (conv / 100) * ticket); if (!ins && !rev) return null; return (
          <div className="mx-5 mt-4 rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 flex items-center gap-6">
            <div><div className="text-lg font-bold text-violet-700 tabular-nums">{ins || "—"}</div><div className="text-[10px] uppercase tracking-wide text-violet-500">leads previstos</div></div>
            {rev > 0 && (<div><div className="text-lg font-bold text-violet-700 tabular-nums">~{rev.toLocaleString("pt-PT")}€</div><div className="text-[10px] uppercase tracking-wide text-violet-500">receita potencial</div></div>)}
          </div>
        ); })()}
        <div className="overflow-y-auto p-5 space-y-5">
          {p.objetivo_negocio && <Block label="Objetivo de negócio">{p.objetivo_negocio}</Block>}

          {(est.formato || est.agenda) && (
            <Block label="Estrutura">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {est.formato && <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{est.formato}</span>}
                {est.duracao_min && <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{est.duracao_min} min</span>}
                {est.modalidade && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{String(est.modalidade).replace(/_/g, " ")}</span>}
                {est.plataforma && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase">{est.plataforma}</span>}
                {est.idioma && <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{est.idioma}</span>}
              </div>
              {Array.isArray(est.agenda) && (
                <ul className="space-y-1 text-sm text-neutral-600">
                  {est.agenda.map((a: any, i: number) => <li key={i} className="flex gap-2"><span className="text-neutral-300">·</span><span>{String(a)}</span></li>)}
                </ul>
              )}
            </Block>
          )}

          {(mer.tendencia || mer.veredicto) && (
            <Block label="Análise de mercado">
              {mer.tendencia && <p className="mb-2">{mer.tendencia}</p>}
              {Array.isArray(mer.sinais) && mer.sinais.length > 0 && <div className="mb-2"><Chips items={mer.sinais} /></div>}
              {mer.veredicto && <p className="text-neutral-500 italic">{mer.veredicto}</p>}
            </Block>
          )}

          {(div.mensagem_chave || div.cadencia) && (
            <Block label="Divulgação">
              {div.mensagem_chave && <p className="mb-2">{div.mensagem_chave}</p>}
              {Array.isArray(div.canais) && <div className="mb-2"><Chips items={div.canais} /></div>}
              {Array.isArray(div.cadencia) && (
                <ul className="space-y-1 text-xs text-neutral-600">
                  {div.cadencia.map((c: any, i: number) => (
                    <li key={i} className="flex flex-wrap gap-x-2">
                      <span className="font-medium text-neutral-800">{c.canal}</span>
                      {Array.isArray(c.dias) && <span>{c.dias.join('/')}</span>}
                      {c.hora && <span>às {c.hora}</span>}
                      {c.frequencia && <span>· {c.frequencia}</span>}
                      {c.dias_antes_inicio && <span className="text-neutral-400">(desde −{c.dias_antes_inicio}d)</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Block>
          )}

          {(con.internos || con.externos) && (
            <Block label="Convidados">
              {con.internos && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-neutral-800 mb-1">Internos</div>
                  {con.internos.criterio && <p className="text-sm text-neutral-600 mb-1.5">{con.internos.criterio}</p>}
                  {Array.isArray(con.internos.fontes) && <Chips items={con.internos.fontes} />}
                </div>
              )}
              {con.externos && (
                <div>
                  <div className="text-xs font-semibold text-neutral-800 mb-1">Externos</div>
                  {con.externos.perfil_ideal && <p className="text-sm text-neutral-600 mb-1.5">{con.externos.perfil_ideal}</p>}
                  {con.externos.estrategia_contacto && <p className="text-sm text-neutral-600 mb-1.5"><span className="text-neutral-400">Abordagem: </span>{con.externos.estrategia_contacto}</p>}
                  {con.externos.linkedin && <p className="text-sm text-neutral-600 mb-1.5"><span className="text-neutral-400">LinkedIn: </span>{con.externos.linkedin}</p>}
              {Array.isArray(con.externos.empresas_alvo) && con.externos.empresas_alvo.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-neutral-800 mb-1">Empresas-alvo (futuros tenants)</div>
                  <ul className="space-y-1">
                    {con.externos.empresas_alvo.map((emp: any, i: number) => (<li key={i} className="text-sm text-neutral-600 flex gap-2"><span className="text-neutral-300">·</span><span>{String(emp)}</span></li>))}
                  </ul>
                </div>
              )}
              {con.externos.nota_conformidade && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">{con.externos.nota_conformidade}</p>}
                </div>
              )}
            </Block>
          )}

          {Array.isArray(p.cross_sell) && p.cross_sell.length > 0 && (
            <Block label="Cross-sell / ofertas">
              <ul className="space-y-2">
                {p.cross_sell.map((o: any, i: number) => (
                  <li key={i} className="rounded-lg border border-neutral-150 bg-neutral-50 px-3 py-2">
                    <div className="text-sm font-medium text-neutral-800">{o.oferta}</div>
                    {o.momento && <div className="text-xs text-neutral-500 mt-0.5">Momento: {o.momento}</div>}
                    {o.cta && <div className="text-xs text-violet-700 mt-0.5">“{o.cta}”</div>}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {p.gravacao && (p.gravacao.gravar || p.gravacao.repositorio) && (
            <Block label="Gravação & repositório (leads perpétuos)">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {p.gravacao.gravar && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Gravar</span>}
                {p.gravacao.repositorio && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Repositório on-demand</span>}
                {p.gravacao.gate_inscricao && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Ver exige inscrição (lead)</span>}
                {p.gravacao.evergreen && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Evergreen</span>}
              </div>
              {p.gravacao.cross_sell_no_replay && <p className="text-sm text-neutral-600 mb-1"><span className="text-neutral-400">Cross-sell no replay: </span>{p.gravacao.cross_sell_no_replay}</p>}
              {p.gravacao.nota && <p className="text-sm text-neutral-600">{p.gravacao.nota}</p>}
            </Block>
          )}

          {(cap.lead_magnet || cap.campos) && (
            <Block label="Captura de leads">
              {Array.isArray(cap.campos) && <div className="mb-2"><Chips items={cap.campos} /></div>}
              {cap.lead_magnet && <p className="text-sm text-neutral-600 mb-1"><span className="text-neutral-400">Lead magnet: </span>{cap.lead_magnet}</p>}
              {cap.oferta_inscricao && <p className="text-sm text-neutral-600"><span className="text-neutral-400">Inscrição: </span>{cap.oferta_inscricao}</p>}
            </Block>
          )}

          {kpis && Object.keys(kpis).length > 0 && (
            <Block label="Metas (KPIs)">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(kpis).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-neutral-50 border border-neutral-150 px-2.5 py-1.5">
                    <div className="text-sm font-semibold text-neutral-900 tabular-nums">{String(v)}</div>
                    <div className="text-[10px] text-neutral-500 leading-tight">{k.replace(/^meta_/, '').replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </Block>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900">Fechar</button>
          {s.status === 'accepted' ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 px-3 py-2"><Check className="w-4 h-4" /> Aprovado</span>
          ) : (
            <button onClick={onAccept} disabled={accepting} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Aprovar plano
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventsAgentClient() {
  const t = useTranslations();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [events, setEvents] = useState<EventMin[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [planLoadingId, setPlanLoadingId] = useState<string | null>(null);
  const [planFor, setPlanFor] = useState<Suggestion | null>(null);
  const [buildFor, setBuildFor] = useState<Suggestion | null>(null);

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const [{ data: sg }, { data: ev }] = await Promise.all([
        sb.rpc('nl_event_suggestions_list'),
        sb.rpc('nl_live_session_list', { p_scope: 'mine' }),
      ]);
      setSuggestions(((sg as { suggestions?: Suggestion[] })?.suggestions) || []);
      setEvents(((ev as { sessions?: EventMin[] })?.sessions) || []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBase(); }, [loadBase]);

  const loadCandidates = useCallback(async (eventId: string) => {
    if (!eventId) { setCandidates([]); return; }
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_event_candidates_list', { p_event_id: eventId });
      setCandidates(((data as { candidates?: Candidate[] })?.candidates) || []);
    } catch { setCandidates([]); }
  }, []);

  useEffect(() => { loadCandidates(selected); }, [selected, loadCandidates]);

  async function generate() {
    setGenerating(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_events_suggest', {});
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error('rpc');
      await loadBase();
    } catch { toast.error(t('events.agent.generating')); }
    finally { setGenerating(false); }
  }

  async function openPlan(s: Suggestion) {
    if (s.plan) { setPlanFor(s); return; }
    setPlanLoadingId(s.id);
    try {
      const sb = createClient();
      // geracao assincrona: dispara em background e faz polling do estado
      await sb.functions.invoke('event-generate', { body: { suggestion_id: s.id } });
      const deadline = Date.now() + 200000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        const { data } = await sb.from('nl_event_suggestions').select('plan,plan_status').eq('id', s.id).maybeSingle();
        const row = data as { plan?: any; plan_status?: string } | null;
        if (row?.plan) {
          const withPlan = { ...s, plan: row.plan };
          setSuggestions((prev) => prev.map((x) => (x.id === s.id ? withPlan : x)));
          setPlanFor(withPlan);
          return;
        }
        if (row?.plan_status === 'erro') throw new Error('gen');
      }
      throw new Error('timeout');
    } catch { toast.error('Não foi possível gerar o plano.'); }
    finally { setPlanLoadingId(null); }
  }

  async function accept(id: string) {
    setAcceptingId(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_suggestion_accept', { p_id: id });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error('rpc');
      toast.success(t('events.agent.accepted'));
      setPlanFor(null);
      await loadBase();
    } catch { toast.error('—'); }
    finally { setAcceptingId(null); }
  }

  async function identify() {
    if (!selected) return;
    setIdentifying(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_identify_guests', { p_event_id: selected });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error('rpc');
      await loadCandidates(selected);
    } catch { toast.error('—'); }
    finally { setIdentifying(false); }
  }

  async function inviteAll() {
    if (!selected) return;
    setInviting(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_invite_bulk', { p_event_id: selected });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error('rpc');
      toast.success(t('events.agent.invited'));
      await loadCandidates(selected);
    } catch { toast.error('—'); }
    finally { setInviting(false); }
  }

  const kindLabel = (k: string) => { try { return t(`events.agent.kind_${k}` as string); } catch { return k; } };
  const pendingCandidates = candidates.filter((c) => c.status === 'candidate').length;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 inline-flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-600" /> {t('events.agent.suggestions')}</h2>
          <button onClick={generate} disabled={generating} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} {t('events.agent.suggest')}
          </button>
        </div>
        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-neutral-500">{t('events.agent.empty_suggestions')}</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {suggestions.map((s) => (
              <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{kindLabel(s.suggested_kind)}</span>
                  <span className="text-xs text-neutral-400 inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> {Math.round(Number(s.score))}</span>
                  {s.plan && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">plano</span>}
                </div>
                <h3 className="font-medium text-neutral-900 leading-snug">{s.title}</h3>
                {s.description && <p className="text-sm text-neutral-700 mt-1.5">{s.description}</p>}
                {s.rationale ? (
                  <div className="mt-2 flex-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">{t('events.agent.why')}</span>
                    <p className="text-sm text-neutral-500 mt-0.5 whitespace-pre-line">{s.rationale}</p>
                  </div>
                ) : <div className="flex-1" />}
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => openPlan(s)} disabled={planLoadingId === s.id} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                    {planLoadingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} {s.plan ? 'Ver plano' : 'Gerar plano'}
                  </button>
                  {s.status === 'accepted' && (
                    <button onClick={() => setBuildFor(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 text-violet-700 px-3 py-1.5 text-sm font-medium hover:bg-violet-50"><Layers className="w-4 h-4" /> Construção</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900 inline-flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-violet-600" /> {t('events.agent.guests')}</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white">
            <option value="">{t('events.agent.pick_event')}</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={identify} disabled={!selected || identifying} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:border-neutral-300 disabled:opacity-50">
              {identifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} {t('events.agent.identify')}
            </button>
            <button onClick={inviteAll} disabled={!selected || inviting || pendingCandidates === 0} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('events.agent.invite_all')}{pendingCandidates > 0 ? ` (${pendingCandidates})` : ''}
            </button>
          </div>
        </div>

        {!selected ? null : candidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-neutral-500">{t('events.agent.no_candidates')}</div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900 truncate">{c.name}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ${c.source === 'intra' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{c.source === 'intra' ? t('events.agent.intra') : t('events.agent.external')}</span>
                  </div>
                  {c.match_reason ? <p className="text-xs text-neutral-500 mt-0.5 truncate">{c.match_reason}</p> : null}
                </div>
                <span className="text-xs text-neutral-400 inline-flex items-center gap-1 shrink-0"><Sparkles className="w-3 h-3" /> {Math.round(Number(c.score))}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${c.status === 'invited' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>{c.status === 'invited' ? t('events.agent.status_invited') : t('events.agent.status_candidate')}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {buildFor && (
        <BuildCockpit suggestion={{ id: buildFor.id, title: buildFor.title }} onClose={() => setBuildFor(null)} phaseLabel={(k) => { try { return t(`events.build.phase_${k}`); } catch { return k; } }} />
      )}
      {planFor && (
        <PlanModal s={planFor} accepting={acceptingId === planFor.id} onAccept={() => accept(planFor.id)} onClose={() => setPlanFor(null)} kindLabel={kindLabel} />
      )}
    </div>
  );
}

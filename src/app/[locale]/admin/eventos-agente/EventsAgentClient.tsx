'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Wand2, Check, UserPlus, Send, Users, Sparkles, Calendar } from 'lucide-react';

type Suggestion = { id: string; title: string; rationale: string | null; suggested_kind: string; topic: string | null; audience: string | null; score: number; status: string; created_session_id: string | null };
type EventMin = { id: string; title: string; session_kind: string; published?: boolean };
type Candidate = { id: string; user_id: string | null; email: string | null; name: string; source: string; match_reason: string | null; score: number; status: string };

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

  async function accept(id: string) {
    setAcceptingId(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_suggestion_accept', { p_id: id });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error('rpc');
      toast.success(t('events.agent.accepted'));
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
      {/* Sugestões */}
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
                </div>
                <h3 className="font-medium text-neutral-900 leading-snug">{s.title}</h3>
                {s.rationale ? <p className="text-sm text-neutral-500 mt-1 line-clamp-3 flex-1">{s.rationale}</p> : <div className="flex-1" />}
                <div className="mt-3">
                  {s.status === 'accepted' ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700"><Check className="w-4 h-4" /> {t('events.agent.accepted')}</span>
                  ) : (
                    <button onClick={() => accept(s.id)} disabled={acceptingId === s.id} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-300 disabled:opacity-50">
                      {acceptingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />} {t('events.agent.accept')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Convidados */}
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
    </div>
  );
}

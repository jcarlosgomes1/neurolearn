'use client';

import { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import {
  CalendarClock, Check, X, Repeat2, Plus, Loader2, Clock, ArrowRight, UserRound, Inbox,
} from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';
const STR: Record<string, Record<Lang, string>> = {
  title: { pt: 'Propostas de reunião', en: 'Meeting proposals', es: 'Propuestas de reunión', fr: 'Propositions de réunion' },
  subtitle: {
    pt: 'Negoceia horários com outras pessoas — propõe, contrapropõe e confirma.',
    en: 'Negotiate times with others — propose, counter and confirm.',
    es: 'Negocia horarios con otras personas — propón, contrapropón y confirma.',
    fr: 'Négocie des horaires — propose, contre-propose et confirme.',
  },
  empty: { pt: 'Ainda não tens propostas de reunião.', en: 'No meeting proposals yet.', es: 'Aún no tienes propuestas.', fr: 'Aucune proposition pour le moment.' },
  your_turn: { pt: 'A tua vez', en: 'Your turn', es: 'Tu turno', fr: 'À ton tour' },
  waiting: { pt: 'A aguardar resposta', en: 'Awaiting reply', es: 'Esperando respuesta', fr: 'En attente' },
  with: { pt: 'Com', en: 'With', es: 'Con', fr: 'Avec' },
  status_pending: { pt: 'Pendente', en: 'Pending', es: 'Pendiente', fr: 'En attente' },
  status_countered: { pt: 'Contraproposta', en: 'Countered', es: 'Contrapropuesta', fr: 'Contre-proposée' },
  status_accepted: { pt: 'Confirmada', en: 'Confirmed', es: 'Confirmada', fr: 'Confirmée' },
  status_declined: { pt: 'Recusada', en: 'Declined', es: 'Rechazada', fr: 'Refusée' },
  status_expired: { pt: 'Expirada', en: 'Expired', es: 'Expirada', fr: 'Expirée' },
  status_cancelled: { pt: 'Cancelada', en: 'Cancelled', es: 'Cancelada', fr: 'Annulée' },
  choose_slot: { pt: 'Escolhe um horário', en: 'Choose a time', es: 'Elige un horario', fr: 'Choisis un horaire' },
  accept: { pt: 'Aceitar', en: 'Accept', es: 'Aceptar', fr: 'Accepter' },
  counter: { pt: 'Contrapropor', en: 'Counter', es: 'Contraproponer', fr: 'Contre-proposer' },
  decline: { pt: 'Recusar', en: 'Decline', es: 'Rechazar', fr: 'Refuser' },
  confirmed_for: { pt: 'Confirmada para', en: 'Confirmed for', es: 'Confirmada para', fr: 'Confirmée pour' },
  new_proposal: { pt: 'Nova proposta', en: 'New proposal', es: 'Nueva propuesta', fr: 'Nouvelle proposition' },
  np_recipient: { pt: 'Email da pessoa', en: 'Person\u2019s email', es: 'Email de la persona', fr: 'E-mail de la personne' },
  np_title: { pt: 'Assunto', en: 'Subject', es: 'Asunto', fr: 'Objet' },
  np_duration: { pt: 'Duração (min)', en: 'Duration (min)', es: 'Duración (min)', fr: 'Durée (min)' },
  np_slots: { pt: 'Horários propostos', en: 'Proposed times', es: 'Horarios propuestos', fr: 'Horaires proposés' },
  np_add_slot: { pt: 'Adicionar horário', en: 'Add time', es: 'Añadir horario', fr: 'Ajouter un horaire' },
  np_send: { pt: 'Enviar proposta', en: 'Send proposal', es: 'Enviar propuesta', fr: 'Envoyer' },
  cancel: { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar', fr: 'Annuler' },
  counter_hint: { pt: 'Propõe horários alternativos:', en: 'Propose alternative times:', es: 'Propón horarios alternativos:', fr: 'Propose des horaires alternatifs :' },
  send_counter: { pt: 'Enviar contraproposta', en: 'Send counter', es: 'Enviar contrapropuesta', fr: 'Envoyer la contre-proposition' },
  round: { pt: 'Ronda', en: 'Round', es: 'Ronda', fr: 'Tour' },
  saved: { pt: 'Feito', en: 'Done', es: 'Hecho', fr: 'Fait' },
  error: { pt: 'Algo correu mal', en: 'Something went wrong', es: 'Algo salió mal', fr: 'Une erreur est survenue' },
  need_fields: { pt: 'Preenche o assunto e pelo menos um horário.', en: 'Fill subject and at least one time.', es: 'Completa el asunto y al menos un horario.', fr: 'Renseigne l\u2019objet et au moins un horaire.' },
};

function cx(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(' '); }

type Slot = { start: string; round: number; chosen: boolean; mine: boolean };
type Proposal = {
  id: string; title: string; description: string | null; duration_min: number;
  status: string; role: 'proposer' | 'recipient'; my_turn: boolean;
  counterpart: { name: string | null; handle: string | null; avatar: string | null } | null;
  accepted_slot: string | null; slots: Slot[];
};

export function ProposalsClient({ initial }: { initial: { ok?: boolean; proposals?: Proposal[] } | null }) {
  const locale = (useLocale() as Lang) || 'pt';
  const t = (k: string) => STR[k]?.[locale] ?? STR[k]?.pt ?? k;
  const sb = useMemo(() => createClient(), []);

  const [proposals, setProposals] = useState<Proposal[]>(initial?.proposals || []);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [counterFor, setCounterFor] = useState<string | null>(null);

  const [npEmail, setNpEmail] = useState('');
  const [npTitle, setNpTitle] = useState('');
  const [npDuration, setNpDuration] = useState('30');
  const [npSlots, setNpSlots] = useState<string[]>(['']);
  const [coSlots, setCoSlots] = useState<string[]>(['']);

  async function refresh() {
    const { data } = await sb.rpc('nl_meeting_proposals_for_me');
    if (data?.proposals) setProposals(data.proposals);
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

  async function accept(id: string, slotStart: string) {
    setBusy(id);
    try {
      const { data } = await sb.rpc('nl_meeting_accept', { p_proposal_id: id, p_slot_start: slotStart });
      if (!data?.ok) throw new Error();
      await refresh();
    } catch { alert(t('error')); } finally { setBusy(null); }
  }
  async function decline(id: string) {
    setBusy(id);
    try {
      const { data } = await sb.rpc('nl_meeting_decline', { p_proposal_id: id });
      if (!data?.ok) throw new Error();
      await refresh();
    } catch { alert(t('error')); } finally { setBusy(null); }
  }
  async function sendCounter(id: string) {
    const slots = coSlots.map(toIso).filter(Boolean) as string[];
    if (slots.length === 0) { alert(t('need_fields')); return; }
    setBusy(id);
    try {
      const { data } = await sb.rpc('nl_meeting_counter', { p_proposal_id: id, p_slots: slots });
      if (!data?.ok) throw new Error();
      setCounterFor(null); setCoSlots(['']);
      await refresh();
    } catch { alert(t('error')); } finally { setBusy(null); }
  }
  async function createProposal() {
    const slots = npSlots.map(toIso).filter(Boolean) as string[];
    if (!npTitle.trim() || slots.length === 0) { alert(t('need_fields')); return; }
    setBusy('new');
    try {
      const { data } = await sb.rpc('nl_meeting_propose', {
        p_recipient_id: null, p_recipient_email: npEmail || null,
        p_title: npTitle, p_slots: slots, p_duration_min: Number(npDuration) || 30,
        p_language_tag: locale,
      });
      if (!data?.ok) throw new Error();
      setCreating(false); setNpEmail(''); setNpTitle(''); setNpDuration('30'); setNpSlots(['']);
      await refresh();
    } catch { alert(t('error')); } finally { setBusy(null); }
  }

  const statusTone = (s: string) => {
    if (s === 'accepted') return 'bg-emerald-100 text-emerald-700';
    if (s === 'declined' || s === 'cancelled' || s === 'expired') return 'bg-slate-100 text-slate-500';
    if (s === 'countered') return 'bg-amber-100 text-amber-700';
    return 'bg-violet-100 text-violet-700';
  };
  const maxRound = (p: Proposal) => p.slots.reduce((m, s) => Math.max(m, s.round), 1);
  const activeSlots = (p: Proposal) => { const r = maxRound(p); return p.slots.filter((s) => s.round === r); };
  const canAct = (p: Proposal) => p.my_turn && (p.status === 'pending' || p.status === 'countered');

  return (
    <div>
      <AppPageHeader title={t('title')} description={t('subtitle')} />

      <div className="mb-5">
        {!creating ? (
          <button onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="h-4 w-4" /> {t('new_proposal')}
          </button>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-violet-600" /> {t('new_proposal')}</div>
            <input value={npTitle} onChange={(e) => setNpTitle(e.target.value)} placeholder={t('np_title')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
            <div className="grid grid-cols-2 gap-3">
              <input value={npEmail} onChange={(e) => setNpEmail(e.target.value)} placeholder={t('np_recipient')} type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
              <input value={npDuration} onChange={(e) => setNpDuration(e.target.value)} type="number" min="15" step="15" placeholder={t('np_duration')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1.5">{t('np_slots')}</div>
              <div className="space-y-2">
                {npSlots.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <input type="datetime-local" value={s}
                      onChange={(e) => setNpSlots((arr) => arr.map((x, j) => j === i ? e.target.value : x))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
                    {npSlots.length > 1 && (
                      <button onClick={() => setNpSlots((arr) => arr.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setNpSlots((arr) => [...arr, ''])} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-800">
                <Plus className="h-3.5 w-3.5" /> {t('np_add_slot')}
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={createProposal} disabled={busy === 'new'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-50">
                {busy === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} {t('np_send')}
              </button>
              <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">{t('cancel')}</button>
            </div>
          </div>
        )}
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Inbox className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{p.title}</h3>
                      <span className={cx('text-[11px] font-semibold px-2 py-0.5 rounded-full', statusTone(p.status))}>{t('status_' + p.status)}</span>
                      {canAct(p) && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">{t('your_turn')}</span>}
                    </div>
                    {p.counterpart?.name && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                        <UserRound className="h-3.5 w-3.5" /> {t('with')} {p.counterpart.name}
                      </div>
                    )}
                    {p.status === 'accepted' && p.accepted_slot && (
                      <div className="text-sm text-emerald-700 mt-1 capitalize">{t('confirmed_for')} {fmt(p.accepted_slot)}</div>
                    )}
                  </div>
                </div>
              </div>

              {(p.status === 'pending' || p.status === 'countered') && (
                <div className="mt-4 pl-1">
                  <div className="text-xs font-medium text-slate-500 mb-2">{t('choose_slot')} · {t('round')} {maxRound(p)}</div>
                  <div className="flex flex-wrap gap-2">
                    {activeSlots(p).map((s, i) => (
                      <div key={i} className={cx('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm capitalize',
                        s.mine ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-violet-200 bg-violet-50 text-slate-800')}>
                        <Clock className="h-3.5 w-3.5" /> {fmt(s.start)}
                        {canAct(p) && !s.mine && (
                          <button onClick={() => accept(p.id, s.start)} disabled={busy === p.id}
                            className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                            <Check className="h-3.5 w-3.5" /> {t('accept')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {canAct(p) && (
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => { setCounterFor(counterFor === p.id ? null : p.id); setCoSlots(['']); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Repeat2 className="h-4 w-4" /> {t('counter')}
                      </button>
                      <button onClick={() => decline(p.id)} disabled={busy === p.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50">
                        <X className="h-4 w-4" /> {t('decline')}
                      </button>
                    </div>
                  )}

                  {counterFor === p.id && (
                    <div className="mt-3 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                      <div className="text-xs text-slate-500 mb-2">{t('counter_hint')}</div>
                      <div className="space-y-2">
                        {coSlots.map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <input type="datetime-local" value={s}
                              onChange={(e) => setCoSlots((arr) => arr.map((x, j) => j === i ? e.target.value : x))}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
                            {coSlots.length > 1 && (
                              <button onClick={() => setCoSlots((arr) => arr.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => setCoSlots((arr) => [...arr, ''])} className="inline-flex items-center gap-1 text-xs font-medium text-violet-700">
                          <Plus className="h-3.5 w-3.5" /> {t('np_add_slot')}
                        </button>
                        <button onClick={() => sendCounter(p.id)} disabled={busy === p.id}
                          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold disabled:opacity-50">
                          {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} {t('send_counter')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

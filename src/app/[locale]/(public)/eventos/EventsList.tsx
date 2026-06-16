'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Clock, MapPin, Users, Video, ArrowRight, Check } from 'lucide-react';

type Ev = {
  id: string; title: string; description: string; type: string; host: string; url: string; cover: string;
  mode: string; location: string; capacity: number | null; language: string;
  starts_at: string; duration_min: number; rsvp_count: number; going: boolean;
};

const GRADS = ['from-violet-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-fuchsia-500 to-pink-600', 'from-blue-500 to-cyan-600', 'from-rose-500 to-red-600'];

export function EventsList({ events, isAuthed }: { events: Ev[]; isAuthed: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const sb = createClient();
  const [state, setState] = useState<Record<string, { going: boolean; count: number }>>(
    Object.fromEntries(events.map((e) => [e.id, { going: e.going, count: e.rsvp_count }]))
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(id: string) {
    if (!isAuthed) { window.location.href = `/${locale}/login?redirect_to=/eventos`; return; }
    setBusy(id);
    const cur = state[id];
    setState((s) => ({ ...s, [id]: { going: !cur.going, count: cur.count + (cur.going ? -1 : 1) } }));
    const { data, error } = await sb.rpc('nl_event_rsvp_toggle', { p_event_id: id });
    if (error || !(data as { ok?: boolean })?.ok) {
      setState((s) => ({ ...s, [id]: cur }));
    } else {
      const d = data as { going: boolean; count: number };
      setState((s) => ({ ...s, [id]: { going: d.going, count: d.count } }));
    }
    setBusy(null);
  }

  const modeLabel = (m: string) => t(`ev.mode.${m}` as string);

  if (events.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">{t('ev.empty')}</div>;
  }

  return (
    <div className="space-y-4">
      {events.map((e, i) => {
        const d = new Date(e.starts_at);
        const grad = GRADS[i % GRADS.length];
        const st = state[e.id];
        return (
          <article key={e.id} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className={`flex-shrink-0 inline-flex flex-col items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br ${grad} text-white shadow-lg`}>
                <div className="text-2xl font-bold" suppressHydrationWarning>{d.getDate()}</div>
                <div className="text-[10px] uppercase font-bold opacity-80" suppressHydrationWarning>{d.toLocaleDateString(locale, { month: 'short' })}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-gradient-to-br ${grad} text-white`}>{e.type}</span>
                  <span className="text-xs text-slate-500 inline-flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="h-3 w-3" /> {d.toLocaleString(locale, { hour: '2-digit', minute: '2-digit' })} · {e.duration_min}m
                  </span>
                  <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                    {e.mode === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />} {modeLabel(e.mode)}{e.location ? ` · ${e.location}` : ''}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{e.title}</h3>
                {e.host ? <p className="text-sm text-slate-500 mt-0.5">{e.host}</p> : null}
                {e.description ? <p className="text-sm text-slate-600 mt-2 line-clamp-2">{e.description}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button onClick={() => toggle(e.id)} disabled={busy === e.id}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${st?.going ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {st?.going ? <><Check className="h-4 w-4" /> {t('ev.rsvp_going')}</> : t('ev.rsvp')}
                  </button>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:gap-1.5 transition-all">
                      {t('ev.join')} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {st?.count ?? e.rsvp_count}{e.capacity ? `/${e.capacity}` : ''} {t('ev.attendees')}
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

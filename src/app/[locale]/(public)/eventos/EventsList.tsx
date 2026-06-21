'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Clock, MapPin, Users, Video, ArrowRight } from 'lucide-react';

type Ev = {
  id: string; title: string; description: string | null; session_kind: string; host: string; url: string;
  cover_url: string | null; location: string | null; attendees_max: number | null; attendees_count: number | null;
  starts_at: string | null;
};

const GRADS = ['from-violet-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-fuchsia-500 to-pink-600', 'from-blue-500 to-cyan-600', 'from-rose-500 to-red-600'];

export function EventsList({ events }: { events: Ev[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const kindLabel = (k: string) => { try { return t(`events.agent.kind_${k}` as string); } catch { return k; } };

  if (!events.length) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">{t('ev.empty')}</div>;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map((e, i) => {
        const d = e.starts_at ? new Date(e.starts_at) : null;
        const grad = GRADS[i % GRADS.length];
        return (
          <article key={e.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col">
            <div className={`relative h-36 bg-gradient-to-br ${grad}`}>
              {e.cover_url ? <img src={e.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" /> : null}
              <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-800">{kindLabel(e.session_kind)}</span>
              {d ? (
                <div className="absolute bottom-3 left-3 text-white drop-shadow">
                  <span className="text-2xl font-bold" suppressHydrationWarning>{d.getDate()}</span>
                  <span className="text-[11px] uppercase font-bold ml-1 opacity-90" suppressHydrationWarning>{d.toLocaleDateString(locale, { month: 'short' })}</span>
                </div>
              ) : null}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-1">
                {d ? <span className="inline-flex items-center gap-1" suppressHydrationWarning><Clock className="h-3 w-3" /> {d.toLocaleString(locale, { hour: '2-digit', minute: '2-digit' })}</span> : null}
                <span className="inline-flex items-center gap-1">{e.location ? <><MapPin className="h-3 w-3" /> {e.location}</> : <><Video className="h-3 w-3" /> {t('events.card.online')}</>}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{e.title}</h3>
              {e.host ? <p className="text-sm text-slate-500 mt-0.5">{e.host}</p> : null}
              {e.description ? <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">{e.description}</p> : <div className="flex-1" />}
              <div className="mt-4 flex items-center justify-between">
                <a href={e.url} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  {t('events.card.register')} <ArrowRight className="h-4 w-4" />
                </a>
                <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {e.attendees_count ?? 0}{e.attendees_max ? `/${e.attendees_max}` : ''}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

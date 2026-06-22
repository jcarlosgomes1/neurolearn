'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { Loader2, Clock, MapPin, Video, Users, ArrowRight, CalendarDays } from 'lucide-react';

type Ev = {
  id: string; title: string; description: string | null; session_kind: string; visibility: string;
  starts_at: string | null; cover_url: string | null; location: string | null;
  attendees_count: number | null; attendees_max: number | null; url: string; host: string;
};

const GRADS = ['from-violet-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-fuchsia-500 to-pink-600', 'from-blue-500 to-cyan-600', 'from-rose-500 to-red-600'];

export function OrgEventsClient({ slug }: { slug: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: o } = await sb.rpc('nl_org_by_slug', { p_slug: slug });
      const org = o as { ok?: boolean; id?: string };
      if (!org?.ok || !org.id) { setEvents([]); return; }
      const { data } = await sb.rpc('nl_events_org_feed', { p_org: org.id, p_lang: locale, p_limit: 48 });
      setEvents(((data as { events?: Ev[] })?.events) || []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, [slug, locale]);

  useEffect(() => { load(); }, [load]);

  const kindLabel = (k: string) => { try { return t(`events.agent.kind_${k}` as string); } catch { return k; } };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-1">
        <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-[var(--org-primary,#6366f1)]/10 text-[var(--org-primary,#6366f1)]"><CalendarDays className="h-5 w-5" /></span>
        <h1 className="text-2xl font-display font-semibold text-slate-900">{t('events.org.title')}</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6 ml-13">{t('events.org.subtitle')}</p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">{t('events.org.empty')}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e, i) => {
            const d = e.starts_at ? new Date(e.starts_at) : null;
            const grad = GRADS[i % GRADS.length];
            return (
              <article key={e.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                <div className={`relative h-32 bg-gradient-to-br ${grad}`}>
                  {e.cover_url ? <img src={e.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" /> : null}
                  <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-800">{kindLabel(e.session_kind)}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-1">
                    {d ? <span className="inline-flex items-center gap-1" suppressHydrationWarning><Clock className="h-3 w-3" /> {d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</span> : null}
                    <span className="inline-flex items-center gap-1">{e.location ? <><MapPin className="h-3 w-3" /> {e.location}</> : <><Video className="h-3 w-3" /> {t('events.card.online')}</>}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{e.title}</h3>
                  {e.host ? <p className="text-xs text-slate-500 mt-0.5">{e.host}</p> : null}
                  {e.description ? <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">{e.description}</p> : <div className="flex-1" />}
                  <div className="mt-4 flex items-center justify-between">
                    <a href={e.url} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold bg-[var(--org-primary,#4f46e5)] text-white hover:opacity-90 transition-opacity">
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
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Globe, Video, ArrowRight } from 'lucide-react';

type Ev = {
  slug: string; title: string; idioma: string;
  event_at: string | null; event_timezone: string | null;
  modalidade: string | null; kind: string | null; room_provider: string | null;
  gravavel: boolean; is_past: boolean; subtitle: string | null;
};

const LANG_NAME: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };

export function EventsRepo({ events, locale }: { events: Ev[]; locale: string }) {
  const t = useTranslations();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [lang, setLang] = useState<string>('all');

  const langs = useMemo(() => Array.from(new Set(events.map((e) => e.idioma).filter(Boolean))), [events]);
  const ordered = useMemo(() => {
    const f = events.filter((e) => (tab === 'past' ? e.is_past : !e.is_past) && (lang === 'all' || e.idioma === lang));
    return tab === 'past' ? [...f].sort((a, b) => (b.event_at || '').localeCompare(a.event_at || '')) : f;
  }, [events, tab, lang]);

  function fmtDate(iso: string | null, tz: string | null) {
    if (!iso) return t('events.repo.tbd');
    try { return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: tz || 'Europe/Lisbon' }); }
    catch { return iso; }
  }

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{t('events.repo.title')}</h1>
          <p className="mt-3 text-lg text-white/90">{t('events.repo.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button onClick={() => setTab('upcoming')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${tab === 'upcoming' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{t('events.repo.tab_upcoming')}</button>
            <button onClick={() => setTab('past')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${tab === 'past' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{t('events.repo.tab_past')}</button>
          </div>
          {langs.length > 1 && (
            <div className="flex items-center gap-1.5 sm:ml-auto" aria-label={t('events.repo.filter_language')}>
              <Globe className="w-4 h-4 text-slate-400" />
              <button onClick={() => setLang('all')} className={`px-2.5 py-1 text-xs rounded-full transition ${lang === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t('events.repo.filter_all')}</button>
              {langs.map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`px-2.5 py-1 text-xs rounded-full transition ${lang === l ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{LANG_NAME[l] || l}</button>
              ))}
            </div>
          )}
        </div>

        {ordered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">{t(tab === 'past' ? 'events.repo.empty_past' : 'events.repo.empty_upcoming')}</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {ordered.map((e) => (
              <a key={e.slug} href={`/${locale}/evento/${e.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-xl hover:-translate-y-0.5 transition flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{LANG_NAME[e.idioma] || e.idioma}</span>
                  {e.modalidade && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{String(e.modalidade).replace(/_/g, ' ')}</span>}
                  {e.is_past && e.gravavel && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">{t('events.repo.recorded')}</span>}
                </div>
                <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-violet-700 transition">{e.title}</h3>
                {e.subtitle && <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{e.subtitle}</p>}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="w-3.5 h-3.5" /> {fmtDate(e.event_at, e.event_timezone)}</div>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-violet-700">
                  {e.is_past && e.gravavel && <Video className="w-4 h-4" />}
                  {t(e.is_past && e.gravavel ? 'events.repo.cta_replay' : 'events.repo.cta_details')}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

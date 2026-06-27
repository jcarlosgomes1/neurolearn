'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, Globe, MapPin, Video, ArrowRight } from 'lucide-react';

type Ev = {
  slug: string; title: string; idioma: string;
  event_at: string | null; event_timezone: string | null;
  modalidade: string | null; kind: string | null; room_provider: string | null;
  gravavel: boolean; is_past: boolean; subtitle: string | null;
};

const LANG_NAME: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };
const FB: Record<string, string> = {
  'events.repo.title': 'Eventos',
  'events.repo.subtitle': 'Sessões ao vivo e gravações da plataforma.',
  'events.repo.upcoming': 'Próximos',
  'events.repo.past': 'Passados',
  'events.repo.all_languages': 'Todas as línguas',
  'events.repo.online': 'Online',
  'events.repo.presencial': 'Presencial',
  'events.repo.replay': 'Ver gravação',
  'events.repo.register': 'Inscrever-me',
  'events.repo.details': 'Detalhes',
  'events.repo.empty': 'Ainda não há eventos publicados.',
};

export function EventsRepo({ events, locale }: { events: Ev[]; locale: string }) {
  const t = useTranslations() as unknown as (key: string) => string;
  const tx = (k: string, fb?: string) => {
    try { const v = t(k); return v && v !== k ? v : (fb ?? FB[k] ?? k); }
    catch { return fb ?? FB[k] ?? k; }
  };
  const langLabel = (l: string) => tx(`events.repo.lang_${l}`, LANG_NAME[l] || l.toUpperCase());

  const [lang, setLang] = useState<string>('all');

  const langs = useMemo(
    () => Array.from(new Set(events.map((e) => e.idioma || 'pt').filter(Boolean))),
    [events]
  );
  const filtered = useMemo(
    () => (lang === 'all' ? events : events.filter((e) => (e.idioma || 'pt') === lang)),
    [events, lang]
  );
  const upcoming = filtered.filter((e) => !e.is_past);
  const past = useMemo(
    () => filtered.filter((e) => e.is_past).sort((a, b) => (b.event_at || '').localeCompare(a.event_at || '')),
    [filtered]
  );

  function fmtDate(iso: string | null, tz: string | null) {
    if (!iso) return null;
    try { return new Date(iso).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: tz || 'Europe/Lisbon' }); }
    catch { return null; }
  }

  function Card({ e }: { e: Ev }) {
    const when = fmtDate(e.event_at, e.event_timezone);
    const online = e.modalidade !== 'presencial' && e.room_provider !== 'presencial';
    return (
      <a href={`/${locale}/evento/${e.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-xl hover:-translate-y-0.5 transition flex flex-col">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700"><Globe className="w-3 h-3" /> {langLabel(e.idioma || 'pt')}</span>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            {online ? (<><Globe className="w-3 h-3" /> {tx('events.repo.online')}</>) : (<><MapPin className="w-3 h-3" /> {tx('events.repo.presencial')}</>)}
          </span>
        </div>
        <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-violet-700 transition">{e.title}</h3>
        {e.subtitle && <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{e.subtitle}</p>}
        {when && <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="w-3.5 h-3.5" /> {when}</div>}
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-violet-700">
          {e.is_past && e.gravavel && <Video className="w-4 h-4" />}
          {e.is_past ? (e.gravavel ? tx('events.repo.replay') : tx('events.repo.details')) : tx('events.repo.register')}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </div>
      </a>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{tx('events.repo.title')}</h1>
          <p className="mt-3 text-lg text-white/90">{tx('events.repo.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {langs.length > 1 && (
          <div className="flex items-center gap-1.5 mb-8 flex-wrap">
            <Globe className="w-4 h-4 text-slate-400" />
            <button onClick={() => setLang('all')} className={`px-3 py-1 text-xs rounded-full transition ${lang === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{tx('events.repo.all_languages')}</button>
            {langs.map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 text-xs rounded-full transition ${lang === l ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{langLabel(l)}</button>
            ))}
          </div>
        )}

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-500">{tx('events.repo.empty')}</div>
        ) : (
          <div className="space-y-10">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">{tx('events.repo.upcoming')}</h2>
                <div className="grid sm:grid-cols-2 gap-4">{upcoming.map((e) => <Card key={e.slug} e={e} />)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">{tx('events.repo.past')}</h2>
                <div className="grid sm:grid-cols-2 gap-4">{past.map((e) => <Card key={e.slug} e={e} />)}</div>
              </section>
            )}
            {upcoming.length === 0 && past.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-500">{tx('events.repo.empty')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

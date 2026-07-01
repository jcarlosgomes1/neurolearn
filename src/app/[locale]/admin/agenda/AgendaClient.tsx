'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { Loader2, CalendarDays, Users, Sparkles, ArrowUpRight, Video, MapPin, Plus } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';

interface Ev { id: string; title: string; type: string | null; mode: string | null; status: string | null; starts_at: string | null; duration_min: number | null; capacity: number | null; host: string | null; language: string | null; rsvp_count: number }
interface Sug { id: string; title: string; rationale: string | null; suggested_kind: string | null; topic: string | null; audience: string | null; score: number | null; status: string | null }

const STATUS_CLS: Record<string, string> = { published: 'bg-emerald-100 text-emerald-700', draft: 'bg-slate-100 text-slate-600', cancelled: 'bg-rose-100 text-rose-700', live: 'bg-blue-100 text-blue-700', ended: 'bg-slate-100 text-slate-500' };

export function AgendaClient() {
  const t = useTranslations();
  const locale = useLocale();
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [suggestions, setSuggestions] = useState<Sug[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_admin_events_overview');
        const d = data as { ok?: boolean; events?: Ev[]; suggestions?: Sug[] } | null;
        setEvents(d?.events || []);
        setSuggestions(d?.suggestions || []);
      } catch { setEvents([]); }
    })();
  }, []);

  function fmt(iso: string | null) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString(locale === 'pt' ? 'pt-PT' : locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="📅" title={t('agenda.title')} description={t('agenda.tip')} actions={
        <Link href={'/admin/webinars' as any} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-3 py-2 text-sm font-medium hover:bg-violet-700">
          <Plus className="w-4 h-4" />{t('agenda.create')}
        </Link>
      } />

      {suggestions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-violet-600" /><h2 className="text-sm font-semibold text-slate-900">{t('agenda.sug_title')}</h2><span className="text-[11px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-semibold">{suggestions.length}</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {suggestions.map((s) => (
              <div key={s.id} className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                  {s.score != null && <span className="text-[10px] font-bold text-violet-700">{Math.round(s.score)}</span>}
                </div>
                {s.rationale && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.rationale}</p>}
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  {s.suggested_kind && <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">{s.suggested_kind}</span>}
                  {s.topic && <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">{s.topic}</span>}
                  {s.audience && <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">{s.audience}</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{t('agenda.sug_hint')}</p>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-900 mb-2">{t('agenda.list_title')}</h2>
      {events === null ? (
        <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={CalendarDays} title={t('agenda.empty_title')} hint={t('agenda.empty_hint')} /></div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <Link key={e.id} href={`/admin/agenda/${e.id}` as any} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">{e.mode === 'online' ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-medium text-slate-900 truncate">{e.title}</span>{e.status && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CLS[e.status] || 'bg-slate-100 text-slate-600'}`}>{e.status}</span>}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap"><span>{fmt(e.starts_at)}</span>{e.type && <span>· {e.type}</span>}<span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{e.rsvp_count}{e.capacity ? `/${e.capacity}` : ''}</span></div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

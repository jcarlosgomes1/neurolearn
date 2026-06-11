'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';

interface EventRow {
  id: number;
  event_type: string;
  actor_id: string | null;
  actor_kind: string;
  subject_kind: string | null;
  subject_id: string | null;
  parent_kind: string | null;
  parent_id: string | null;
  payload: any;
  occurred_at: string;
}

interface Counts { event_type: string; count: number }

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  lesson_started: { emoji: '▶️', color: 'bg-blue-50 text-blue-700' },
  lesson_completed: { emoji: '✓', color: 'bg-emerald-50 text-emerald-700' },
  review_submitted: { emoji: '⭐', color: 'bg-amber-50 text-amber-700' },
  review_updated: { emoji: '✏️', color: 'bg-amber-50 text-amber-700' },
  course_enrolled: { emoji: '🎓', color: 'bg-purple-50 text-purple-700' },
  application_submitted: { emoji: '📥', color: 'bg-cyan-50 text-cyan-700' },
  application_status_changed: { emoji: '🔄', color: 'bg-cyan-50 text-cyan-700' },
  credits_spent: { emoji: '💎', color: 'bg-slate-50 text-slate-700' },
  credits_denied: { emoji: '🚫', color: 'bg-rose-50 text-rose-700' },
};

function localeToBcp(locale: string): string {
  if (locale === 'pt') return 'pt-PT';
  if (locale === 'en') return 'en-GB';
  if (locale === 'es') return 'es-ES';
  if (locale === 'fr') return 'fr-FR';
  return 'pt-PT';
}

export function EventsView() {
  const t = useTranslations();
  const locale = useLocale();
  const bcp = localeToBcp(locale);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Counts[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  function fmt(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return t('events.ago_s', { n: Math.floor(diff) });
    if (diff < 3600) return t('events.ago_m', { n: Math.floor(diff / 60) });
    if (diff < 86400) return t('events.ago_h', { n: Math.floor(diff / 3600) });
    return new Date(iso).toLocaleDateString(bcp, { day: '2-digit', month: 'short' });
  }

  async function load() {
    const sb = createClient();
    let q = sb.from('nl_events').select('*').order('occurred_at', { ascending: false }).limit(200);
    if (filter !== 'all') q = q.eq('event_type', filter);
    const { data } = await q;
    setEvents((data as EventRow[]) || []);

    const { data: countsData } = await sb.from('nl_events')
      .select('event_type')
      .gte('occurred_at', new Date(Date.now() - 86400000).toISOString());
    const map: Record<string, number> = {};
    ((countsData as { event_type: string }[]) || []).forEach((r) => { map[r.event_type] = (map[r.event_type] || 0) + 1; });
    setCounts(Object.entries(map).map(([event_type, count]) => ({ event_type, count })).sort((a, b) => b.count - a.count));
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, [autoRefresh, filter]);

  const total24h = counts.reduce((s, c) => s + c.count, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        backHref="/admin"
        emoji="📡"
        title={t('events.title')}
        description={t('events.subtitle', { total: total24h.toLocaleString(bcp), shown: events.length })}
        actions={
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-4 h-4 accent-brand-600" />
            {t('events.auto_refresh')}
          </label>
        }
      />

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFilter('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filter==='all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
          {t('events.filter_all')} <span className="tabular-nums opacity-70">{total24h}</span>
        </button>
        {counts.slice(0, 12).map((c) => {
          const meta = TYPE_META[c.event_type] || { emoji: '•', color: 'bg-slate-50' };
          return (
            <button key={c.event_type} onClick={() => setFilter(c.event_type)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${filter===c.event_type ? 'bg-slate-900 text-white' : `bg-white border border-slate-200 ${meta.color.replace('bg-','text-').split(' ')[0]} hover:opacity-90`}`}>
              <span>{meta.emoji}</span>
              <span>{c.event_type.replace(/_/g, ' ')}</span>
              <span className="tabular-nums opacity-70">{c.count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{t('events.loading')}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 mt-5">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-slate-600">{t('events.empty')}</p>
        </div>
      ) : (
        <div className="mt-5 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {events.map((ev) => {
            const meta = TYPE_META[ev.event_type] || { emoji: '•', color: 'bg-slate-50 text-slate-700' };
            return (
              <div key={ev.id} className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full ${meta.color} flex items-center justify-center text-sm`}>{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{ev.event_type.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-400 tabular-nums">{fmt(ev.occurred_at)}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
                      {ev.actor_kind === 'system' ? <span>{t('events.actor_system')}</span> : ev.actor_id ? <span>👤 {ev.actor_id.slice(0,8)}</span> : null}
                      {ev.subject_kind && ev.subject_id && <span>{ev.subject_kind}: {ev.subject_id.slice(0, 12)}</span>}
                      {ev.parent_kind && ev.parent_id && <span>{ev.parent_kind}: {ev.parent_id.slice(0, 12)}</span>}
                    </div>
                    {ev.payload && Object.keys(ev.payload).length > 0 && (
                      <code className="block mt-1 text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded truncate">
                        {JSON.stringify(ev.payload).slice(0, 200)}
                      </code>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

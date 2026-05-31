'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

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

function fmt(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `há ${Math.floor(diff)}s`;
  if (diff < 3600) return `há ${Math.floor(diff/60)}m`;
  if (diff < 86400) return `há ${Math.floor(diff/3600)}h`;
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

export function EventsView() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Counts[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function load() {
    const sb = createClient();
    let q = sb.from('nl_events').select('*').order('occurred_at', { ascending: false }).limit(200);
    if (filter !== 'all') q = q.eq('event_type', filter);
    const { data } = await q;
    setEvents((data as EventRow[]) || []);

    // Contadores das últimas 24h (consulta separada)
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
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
      <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📡 Eventos da plataforma</h1>
          <p className="text-sm text-slate-500 mt-1 tabular-nums">{total24h.toLocaleString('pt-PT')} eventos nas últimas 24h · {events.length} mostrados</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-4 h-4 accent-brand-600" />
          Auto-refresh 10s
        </label>
      </div>

      {/* Contadores 24h */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFilter('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filter==='all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
          Tudo <span className="tabular-nums opacity-70">{total24h}</span>
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

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">A carregar...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 mt-5">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-slate-600">Sem eventos neste filtro.</p>
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
                      {ev.actor_kind === 'system' ? <span>🤖 sistema</span> : ev.actor_id ? <span>👤 {ev.actor_id.slice(0,8)}</span> : null}
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

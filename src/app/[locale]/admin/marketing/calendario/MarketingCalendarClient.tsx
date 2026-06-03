'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Sparkles, Calendar as CalIcon, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { toast } from 'sonner';

interface CalEvent {
  id: string;
  scheduled_at: string;
  channel: string;
  resource_type: string;
  resource_id: string | null;
  title: string | null;
  status: string;
  ai_suggested: boolean;
  ai_confidence: number | null;
  rationale: string | null;
}

interface Cadence {
  channel: string;
  posts_per_week: number;
  best_hours_utc: number[];
  best_weekdays: number[];
  ai_rationale: string | null;
  enabled: boolean;
}

interface Props {
  initialYear: number;
  initialMonth: number;
  initialEvents: CalEvent[];
  cadence: Cadence[];
}

const CHANNEL_META: Record<string, { emoji: string; color: string; label: string }> = {
  blog: { emoji: '✍️', color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Blog' },
  linkedin: { emoji: '💼', color: 'bg-sky-100 text-sky-700 border-sky-200', label: 'LinkedIn' },
  twitter: { emoji: '𝕏', color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'X (Twitter)' },
  x: { emoji: '𝕏', color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'X' },
  facebook: { emoji: '👍', color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Facebook' },
  instagram: { emoji: '📸', color: 'bg-pink-100 text-pink-700 border-pink-200', label: 'Instagram' },
  tiktok: { emoji: '🎵', color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', label: 'TikTok' },
  course_launch: { emoji: '🚀', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Lançamento' },
  email_newsletter: { emoji: '📧', color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Newsletter' },
};

const STATUS_BADGE: Record<string, string> = {
  planned: 'bg-slate-100 text-slate-600',
  generated: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  published: 'bg-emerald-600 text-white',
  cancelled: 'bg-rose-100 text-rose-600 line-through',
};

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function startOfMonth(y: number, m: number) { return new Date(y, m - 1, 1); }
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

export function MarketingCalendarClient({ initialYear, initialMonth, initialEvents, cadence }: Props) {
  const t = useTranslations();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalEvent[]>(initialEvents);
  const [suggesting, setSuggesting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  const eventsByDay = useMemo(() => {
    const acc: Record<number, CalEvent[]> = {};
    for (const e of events) {
      const day = new Date(e.scheduled_at).getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(e);
    }
    return acc;
  }, [events]);

  const firstDay = startOfMonth(year, month).getDay();
  const total = daysInMonth(year, month);
  const cells = Array.from({ length: firstDay + total }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  while (cells.length % 7 !== 0) cells.push(null);

  function prev() { if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1); }
  function next() { if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1); }

  async function refreshEvents(y: number, m: number) {
    const sb = createClient();
    const { data } = await sb.rpc('nl_marketing_calendar_month', { p_year: y, p_month: m });
    setEvents((data || []) as CalEvent[]);
  }

  async function suggest() {
    if (suggesting) return;
    setSuggesting(true);
    const toastId = toast.loading(t('mkt_cal.suggesting'));
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/suggest-marketing-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ year, month }),
      });
      const data = await resp.json();
      if (!data.ok) {
        toast.error(t('mkt_cal.suggest_failed') + ' · ' + (data.error || ''), { id: toastId });
      } else {
        toast.success(`${data.inserted} · ${t('mkt_cal.suggest_done')}`, { id: toastId });
        await refreshEvents(year, month);
      }
    } catch (e) {
      toast.error(t('mkt_cal.suggest_failed'), { id: toastId });
    } finally {
      setSuggesting(false);
    }
  }

  async function approveEvent(id: string) {
    const sb = createClient();
    const { data, error } = await sb.rpc('nl_marketing_calendar_approve', { p_event_id: id });
    if (error || !data?.ok) {
      toast.error(error?.message || data?.error || 'failed');
      return;
    }
    toast.success(t('mkt_cal.event_approved'));
    setSelectedEvent(null);
    await refreshEvents(year, month);
  }

  async function cancelEvent(id: string) {
    const sb = createClient();
    const { error } = await sb.rpc('nl_marketing_calendar_cancel', { p_event_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success(t('mkt_cal.event_cancelled'));
    setSelectedEvent(null);
    await refreshEvents(year, month);
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('mkt_cal.title')}</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">{t('mkt_cal.subtitle')}</p>
        </div>
        <button
          onClick={suggest}
          disabled={suggesting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          {suggesting ? t('mkt_cal.suggesting') : t('mkt_cal.suggest_btn')}
        </button>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CalIcon className="h-4 w-4 text-brand-600" />
          {t('mkt_cal.cadence_title')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cadence.map((c) => {
            const meta = CHANNEL_META[c.channel] || { emoji: '📌', color: 'bg-slate-100 text-slate-700', label: c.channel };
            return (
              <div key={c.channel} className={`rounded-lg border p-3 ${meta.color}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-xs font-mono">{c.posts_per_week}/sem</span>
                </div>
                <div className="text-xs font-semibold mb-1">{meta.label}</div>
                <div className="text-[10px] opacity-80">{c.best_hours_utc.map((h) => `${h}h`).join(' · ')}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-semibold text-slate-900 capitalize">{monthLabel}</h2>
          <button onClick={next} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-100">
          {WEEKDAYS_PT.map((w) => <div key={w} className="py-2">{w}</div>)}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div key={i} className={`min-h-[88px] border-r border-b border-slate-100 p-1.5 ${day === null ? 'bg-slate-50' : 'bg-white'}`}>
              {day !== null && (
                <>
                  <div className="text-xs text-slate-400 font-medium mb-1">{day}</div>
                  <div className="space-y-1">
                    {(eventsByDay[day] || []).slice(0, 3).map((e) => {
                      const meta = CHANNEL_META[e.channel] || { emoji: '📌', color: 'bg-slate-100 text-slate-700 border-slate-200', label: e.channel };
                      const statusOverlay = e.status === 'cancelled' ? 'opacity-40 line-through' : e.status === 'approved' ? 'ring-1 ring-emerald-400' : '';
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className={`block w-full text-left text-[10px] px-1.5 py-1 rounded border truncate ${meta.color} ${statusOverlay} hover:scale-[1.02] transition-transform`}
                          title={e.title || meta.label}
                        >
                          {meta.emoji} {e.title || meta.label}
                        </button>
                      );
                    })}
                    {(eventsByDay[day] || []).length > 3 && (
                      <div className="text-[10px] text-slate-400">+{(eventsByDay[day] || []).length - 3}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500 border-t border-slate-100">{t('mkt_cal.empty')}</div>
        )}
      </section>

      {/* Modal de detalhe + aprovar/cancelar */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">{t('mkt_cal.event_details')}</div>
                <div className="font-bold text-slate-900 text-lg leading-tight">{selectedEvent.title || (CHANNEL_META[selectedEvent.channel]?.label || selectedEvent.channel)}</div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 -mr-2 -mt-1 p-2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-base">{CHANNEL_META[selectedEvent.channel]?.emoji || '📌'}</span>
                <span className="font-medium">{CHANNEL_META[selectedEvent.channel]?.label || selectedEvent.channel}</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGE[selectedEvent.status] || 'bg-slate-100'}`}>
                  {t(`mkt_cal.status.${selectedEvent.status}` as any) || selectedEvent.status}
                </span>
              </div>
              <div className="text-slate-600">
                {new Date(selectedEvent.scheduled_at).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
              {selectedEvent.rationale && (
                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">{t('mkt_cal.ai_rationale')}</div>
                  <div className="text-sm text-slate-700">{selectedEvent.rationale}</div>
                </div>
              )}
            </div>

            {(selectedEvent.status === 'planned' || selectedEvent.status === 'generated') && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => approveEvent(selectedEvent.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" /> {t('mkt_cal.approve')}
                </button>
                <button
                  onClick={() => cancelEvent(selectedEvent.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium"
                >
                  <X className="h-4 w-4" /> {t('mkt_cal.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

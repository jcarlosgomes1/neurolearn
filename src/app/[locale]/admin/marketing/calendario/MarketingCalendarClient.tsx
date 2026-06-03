'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Sparkles, Calendar as CalIcon } from 'lucide-react';

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
  course_launch: { emoji: '🚀', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Lançamento curso' },
  email_newsletter: { emoji: '📧', color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Newsletter' },
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

  // Group events by day-of-month
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

  function prev() {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  }
  function next() {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  }

  async function suggest() {
    setSuggesting(true);
    // TODO: chamar edge function suggest-marketing-schedule
    setTimeout(() => setSuggesting(false), 1200);
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
          {suggesting ? '…' : t('mkt_cal.suggest_btn')}
        </button>
      </div>

      {/* Cadência por canal */}
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
                <div className="text-[10px] opacity-80">
                  {c.best_hours_utc.map((h) => `${h}h`).join(' · ')}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Calendário mensal */}
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
            <div
              key={i}
              className={`min-h-[88px] border-r border-b border-slate-100 p-1.5 ${day === null ? 'bg-slate-50' : 'bg-white'}`}
            >
              {day !== null && (
                <>
                  <div className="text-xs text-slate-400 font-medium mb-1">{day}</div>
                  <div className="space-y-1">
                    {(eventsByDay[day] || []).slice(0, 3).map((e) => {
                      const meta = CHANNEL_META[e.channel] || { emoji: '📌', color: 'bg-slate-100 text-slate-700 border-slate-200', label: e.channel };
                      return (
                        <div
                          key={e.id}
                          className={`text-[10px] px-1.5 py-1 rounded border truncate ${meta.color}`}
                          title={e.title || meta.label}
                        >
                          {meta.emoji} {e.title || meta.label}
                        </div>
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
          <div className="p-8 text-center text-sm text-slate-500 border-t border-slate-100">
            {t('mkt_cal.empty')}
          </div>
        )}
      </section>
    </div>
  );
}

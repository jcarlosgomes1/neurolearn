'use client';
import { CalendarPlus } from 'lucide-react';

interface Props { title: string; startIso: string; endIso?: string | null; url?: string | null; label: string }

export function AddToCalendar({ title, startIso, endIso, url, label }: Props) {
  function esc(s: string) { return s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); }
  function dt(iso: string) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function download() {
    const start = dt(startIso);
    const end = endIso ? dt(endIso) : dt(new Date(new Date(startIso).getTime() + 3600000).toISOString());
    const uid = `${start}-${Math.random().toString(36).slice(2)}@neurolearn`;
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NeuroLearn//Agenda//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${uid}`, `DTSTAMP:${dt(new Date().toISOString())}`, `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:${esc(title)}`,
    ];
    if (url) { lines.push(`DESCRIPTION:${esc(url)}`); lines.push(`URL:${esc(url)}`); }
    lines.push('END:VEVENT', 'END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${(title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)) || 'evento'}.ics`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return (
    <button onClick={download} type="button"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
      <CalendarPlus className="h-4 w-4" /> {label}
    </button>
  );
}

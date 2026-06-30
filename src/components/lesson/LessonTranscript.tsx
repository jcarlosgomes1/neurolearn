'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Languages } from 'lucide-react';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface Props {
  segments: TranscriptSegment[];
  activeTime?: number;
  status?: string;
  available?: string[];
  lang?: string;
  onLangChange?: (lang: string) => void;
  onSeek?: (seconds: number) => void;
}

const LANG_LABEL: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

export function LessonTranscript({ segments, activeTime = 0, status, available = [], lang, onLangChange, onSeek }: Props) {
  const t = useTranslations('transcript');
  const [q, setQ] = useState('');
  const activeRef = useRef<HTMLButtonElement>(null);

  const activeIdx = useMemo(() => {
    if (!segments.length) return -1;
    for (let i = 0; i < segments.length; i++) {
      if (activeTime >= segments[i].start && activeTime < segments[i].end) return i;
    }
    let idx = -1;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].start <= activeTime) idx = i; else break;
    }
    return idx;
  }, [segments, activeTime]);

  useEffect(() => {
    if (activeRef.current && !q) activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIdx, q]);

  const filtered = useMemo(() => {
    const indexed = segments.map((s, i) => ({ s, i }));
    if (!q.trim()) return indexed;
    const needle = q.toLowerCase();
    return indexed.filter(({ s }) => s.text.toLowerCase().includes(needle));
  }, [segments, q]);

  if ((!segments || segments.length === 0) && status && status !== 'ready' && status !== 'translated') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" /> {t('generating')}
      </div>
    );
  }
  if (!segments || segments.length === 0) return null;

  function highlight(text: string): ReactNode {
    if (!q.trim()) return text;
    const needle = q.trim();
    const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
    return parts.map((p, k) =>
      p.toLowerCase() === needle.toLowerCase()
        ? <mark key={k} className="bg-amber-200 rounded px-0.5">{p}</mark>
        : <span key={k}>{p}</span>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="p-3 border-b border-slate-100 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search_placeholder')}
            aria-label={t('search_placeholder')}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        {available.length > 1 && (
          <div className="relative">
            <Languages className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={lang}
              onChange={(e) => onLangChange?.(e.target.value)}
              aria-label={t('language')}
              className="pl-7 pr-2 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 appearance-none cursor-pointer"
            >
              {available.map((l) => <option key={l} value={l}>{LANG_LABEL[l] || l.toUpperCase()}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="overflow-y-auto max-h-[420px] divide-y divide-slate-50">
        {filtered.length === 0 && <div className="p-4 text-sm text-slate-400 text-center">{t('no_results')}</div>}
        {filtered.map(({ s, i }) => (
          <button
            key={i}
            ref={i === activeIdx ? activeRef : undefined}
            onClick={() => onSeek?.(s.start)}
            className={`w-full text-left flex gap-3 px-3 py-2.5 transition hover:bg-slate-50 ${i === activeIdx ? 'bg-brand-50' : ''}`}
          >
            <span className={`shrink-0 tabular-nums text-xs mt-0.5 ${i === activeIdx ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}>{mmss(s.start)}</span>
            <span className={`text-sm leading-relaxed ${i === activeIdx ? 'text-slate-900' : 'text-slate-600'}`}>{highlight(s.text)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

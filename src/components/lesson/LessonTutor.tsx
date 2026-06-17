'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { Markdown } from '@/components/shared/Markdown';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string }

interface LessonContext {
  course_id?: string;
  course_title: string;
  course_level?: string;
  module_title: string;
  module_index?: number;
  lesson_title: string;
  lesson_index?: number;
  lesson_type?: string;
  paragraphs?: string[];
  key_points?: string[];
  code?: string | null;
  tip?: string | null;
  language?: string;
}

export function LessonTutor({ context, onClose }: { context: LessonContext; onClose?: () => void }) {
  const t = useTranslations('lesson_tutor');
  const SUGGESTIONS = [t('s1'), t('s2'), t('s3'), t('s4')];
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [disabledReason, setDisabledReason] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      setLoadingHistory(true);
      setMessages([]);
      setHasHistory(false);
      setInput('');
      setDisabled(false);
      setDisabledReason(null);

      if (!context.course_id || context.module_index === undefined || context.lesson_index === undefined) {
        setLoadingHistory(false);
        return;
      }

      try {
        const sb = createClient();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) { setLoadingHistory(false); return; }
        const res = await fetch(`${SUPABASE_URL}/functions/v1/lesson-tutor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'load_history', lesson_context: context }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.ok && data.has_history && Array.isArray(data.messages)) {
          setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
          setHasHistory(true);
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoadingHistory(false); }
    }
    loadHistory();
    return () => { cancelled = true; };
  }, [context.course_id, context.module_index, context.lesson_index]);

  async function send(text: string) {
    if (!text.trim() || sending || disabled) return;
    const next: Msg[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        toast.error(t('sign_in'));
        setSending(false); setMessages(messages); return;
      }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/lesson-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ lesson_context: context, messages: next }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.error === 'daily_limit_reached') {
          setDisabled(true);
          setDisabledReason(t('daily_limit', { n: data.daily_limit || dailyLimit || 20 }));
        } else if (data.error === 'tutor_disabled_by_admin') {
          setDisabled(true);
          setDisabledReason(t('disabled_admin'));
        } else {
          toast.error(data.error || t('failure'));
        }
        setMessages(messages);
        setSending(false); return;
      }
      setMessages([...next, { role: 'assistant', content: data.answer || '...' }]);
      setHasHistory(true);
      if (typeof data.remaining_today === 'number') setRemaining(data.remaining_today);
      if (typeof data.daily_limit === 'number') setDailyLimit(data.daily_limit);
    } catch (e: any) {
      toast.error(e.message);
      setMessages(messages);
    } finally { setSending(false); }
  }

  const isLow = remaining !== null && remaining <= 3;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white"><GraduationCap className="h-4 w-4" /></div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{t('title')}</div>
            <div className="text-[11px] text-slate-500 truncate">
              {hasHistory ? t('history_label', { n: messages.length }) : t('about_lesson')}
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label={t('close_aria')} className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0">×</button>
        )}
      </div>

      {remaining !== null && (
        <div className={`px-4 py-1.5 text-[11px] flex-shrink-0 ${isLow ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
          {remaining === 1 ? t('remaining_singular', { n: remaining }) : t('remaining_plural', { n: remaining })}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingHistory && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {!loadingHistory && messages.length === 0 && !disabled && (
          <div className="text-center text-sm text-slate-500 py-6">
            <p>{t('intro_hi')}</p>
            <p className="mt-1">{t('intro_ask')} <strong>{context.lesson_title}</strong>.</p>
            <div className="mt-5 space-y-1.5 text-left">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="block w-full text-left px-3 py-2 bg-slate-50 hover:bg-brand-50 rounded-lg text-xs text-slate-700 hover:text-brand-700 transition-colors">
                  💬 {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {!loadingHistory && hasHistory && messages.length > 0 && (
          <div className="text-[11px] text-center text-slate-400 mb-3 flex items-center gap-2 justify-center">
            <span className="h-px bg-slate-200 flex-1" />
            <span>{t('prev_conversation')}</span>
            <span className="h-px bg-slate-200 flex-1" />
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              {m.role === 'assistant' ? <div className="prose prose-sm prose-slate max-w-none"><Markdown source={m.content} /></div> : m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-3.5 py-2.5 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {disabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            ⏱ {disabledReason}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 flex-shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending || disabled || loadingHistory}
            placeholder={disabled ? t('unavailable') : loadingHistory ? t('loading') : t('placeholder')}
            className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 focus:border-brand-400 focus:outline-none text-sm disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button type="submit" disabled={sending || disabled || loadingHistory || !input.trim()} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-medium px-4 rounded-lg text-sm transition-colors flex-shrink-0">
            {t('send')}
          </button>
        </form>
      </div>
    </div>
  );
}

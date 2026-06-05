'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Send, Loader2, MessageCircle, X } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; created_at?: string; }

export function AITutorPanel({ courseId, moduleIndex, lessonIndex, lessonTitle, lessonContent, collapsed: defaultCollapsed = true }: {
  courseId: string; moduleIndex: number; lessonIndex: number;
  lessonTitle: string; lessonContent?: string;
  collapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sb = createClient();

  useEffect(() => {
    if (collapsed || loaded) return;
    (async () => {
      const { data } = await sb.rpc('nl_tutor_session_get_or_create', {
        p_course_id: courseId, p_module: moduleIndex, p_lesson: lessonIndex,
      });
      const r = data as any;
      if (r?.ok) {
        setSessionId(r.session_id);
        setMessages(r.messages || []);
        setLoaded(true);
      }
    })();
  }, [collapsed, loaded, courseId, moduleIndex, lessonIndex, sb]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  function send() {
    const text = input.trim();
    if (!text || !sessionId) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    startTransition(async () => {
      await sb.rpc('nl_tutor_message_log', { p_session_id: sessionId, p_role: 'user', p_content: text });
      const { data: { session } } = await sb.auth.getSession();
      try {
        const res = await fetch('https://obpezocujzdaznrdgwoo.supabase.co/functions/v1/lesson-tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({
            course_id: courseId, module_index: moduleIndex, lesson_index: lessonIndex,
            lesson_title: lessonTitle, lesson_content: lessonContent,
            history: [...messages, userMsg],
            question: text,
          }),
        });
        const data = await res.json();
        const answer = data?.answer || data?.message || data?.text || 'Sem resposta';
        setMessages((m) => [...m, { role: 'assistant', content: answer }]);
        await sb.rpc('nl_tutor_message_log', { p_session_id: sessionId, p_role: 'assistant', p_content: answer, p_tokens: data?.tokens || null });
      } catch (e: any) {
        setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Erro: ' + (e?.message || 'desconhecido') }]);
      }
    });
  }

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-brand-600 text-white shadow-xl rounded-full hover:scale-105 transition-transform">
        <Sparkles className="h-5 w-5" />
        <span className="font-semibold">Tutor IA</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 h-[70vh] sm:h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 to-brand-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h3 className="font-semibold text-sm">Tutor IA</h3>
        </div>
        <button onClick={() => setCollapsed(true)} className="p-1 hover:bg-white/10 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
        {messages.length === 0 && !sending && (
          <div className="text-center py-8 px-3 text-sm text-slate-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            Pergunta o que quiseres sobre <strong className="text-slate-700">{lessonTitle}</strong>.
            <div className="mt-3 space-y-1 text-xs">
              {['Resume a aula em 3 pontos', 'Dá um exemplo prático', 'Não percebi este conceito…'].map((q) => (
                <button key={q} onClick={() => setInput(q)} className="block w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-slate-600">
                  → {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin inline" /> A pensar…
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-slate-200 p-2 flex gap-1">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !sending && send()}
          placeholder="Pergunta algo…" disabled={sending}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-400" />
        <button onClick={send} disabled={sending || !input.trim()}
          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

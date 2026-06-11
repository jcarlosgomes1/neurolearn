'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, EyeOff, RotateCcw, Flag, Bot } from 'lucide-react';

interface Item {
  kind: string; id: string; course_id: string; course_title: string;
  text_title: string; text_body: string; status: string; report_count: number;
  ai_flagged: boolean; ai_verdict: any; lang: string; created_at: string; author_name: string;
}

export function QaModerationClient() {
  const sb = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await sb.rpc('nl_qa_moderation_queue', { p_limit: 200 });
    setItems((((data as any)?.items) || []) as Item[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function act(it: Item, action: string) {
    setBusy(it.kind + it.id);
    await sb.rpc('nl_qa_moderate', { p_kind: it.kind, p_id: it.id, p_action: action, p_reason: null });
    setBusy(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>;
  if (items.length === 0) return <div className="text-center py-16 text-slate-400 text-sm">Nada para moderar.</div>;

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const k = it.kind + it.id;
        return (
          <div key={k} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase">{it.kind === 'question' ? 'Pergunta' : 'Resposta'}</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold ${it.status === 'hidden' ? 'bg-rose-100 text-rose-700' : it.status === 'flagged' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{it.status}</span>
              {it.report_count > 0 ? <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 flex items-center gap-1"><Flag className="h-3 w-3" />{it.report_count}</span> : null}
              {it.ai_flagged ? <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 flex items-center gap-1"><Bot className="h-3 w-3" />{it.ai_verdict?.verdict || 'flag'}</span> : null}
              <span className="text-slate-400">&middot; {it.course_title}</span>
            </div>
            {it.kind === 'question' ? <p className="font-semibold text-slate-900 text-sm">{it.text_title}</p> : null}
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap line-clamp-4">{it.text_body}</p>
            <p className="text-[11px] text-slate-400 mt-1.5">{it.author_name || 'Aluno'}{it.ai_verdict?.reason ? ' · ' + it.ai_verdict.reason : ''}</p>
            <div className="flex gap-2 mt-3">
              {it.status !== 'hidden' ? (
                <button onClick={() => act(it, 'hide')} disabled={busy === k} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white disabled:opacity-50 flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" />Esconder</button>
              ) : (
                <button onClick={() => act(it, 'restore')} disabled={busy === k} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-50 flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" />Restaurar</button>
              )}
              {it.status === 'flagged' ? <button onClick={() => act(it, 'restore')} disabled={busy === k} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50">Aprovar</button> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

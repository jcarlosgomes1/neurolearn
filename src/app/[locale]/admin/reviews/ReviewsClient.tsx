'use client';

import { useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, EyeOff, Eye, Flag, Trash2, Loader2 } from 'lucide-react';

type Review = {
  id: string; course_id: string | null; rating: number | null;
  title: string | null; body: string | null;
  reported: boolean; hidden: boolean; verified_purchase: boolean;
  helpful_count: number | null; created_at: string | null;
};

type Action = 'hide' | 'unhide' | 'dismiss_report' | 'delete';

export function ReviewsClient({ initial }: { initial: Review[] }) {
  const [rows, setRows] = useState<Review[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const sb = createClient();

  async function act(id: string, action: Action) {
    setErr(null); setBusy(id);
    const { error } = await sb.rpc('nl_course_review_moderate', { p_id: id, p_action: action });
    if (error) { setErr(error.message); setBusy(null); return; }
    setRows((r) => {
      if (action === 'delete') return r.filter((x) => x.id !== id);
      return r.map((x) => x.id === id
        ? { ...x, hidden: action === 'hide' ? true : action === 'unhide' ? false : x.hidden, reported: action === 'dismiss_report' ? false : x.reported }
        : x);
    });
    setBusy(null);
  }

  const Btn = ({ onClick, children, tone }: { onClick: () => void; children: ReactNode; tone: string }) => (
    <button onClick={onClick} disabled={busy !== null} className={'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ' + tone}>{children}</button>
  );

  return (
    <div className="space-y-3">
      {err ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div> : null}
      {rows.map((r) => (
        <div key={r.id} className={'rounded-2xl border bg-white p-4 shadow-sm ' + (r.hidden ? 'border-slate-200 opacity-60' : r.reported ? 'border-rose-200' : 'border-slate-200')}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={'h-3.5 w-3.5 ' + (i < (r.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200')} />
                  ))}
                </span>
                {r.title ? <span className="font-semibold text-slate-900">{r.title}</span> : null}
                {r.reported ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">reportado</span> : null}
                {r.hidden ? <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">oculto</span> : null}
                {r.verified_purchase ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">verificado</span> : null}
              </div>
              {r.body ? <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{r.body}</p> : null}
              <div className="mt-1 text-xs text-slate-400">{r.course_id} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</div>
            </div>
            {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.hidden
              ? <Btn onClick={() => act(r.id, 'unhide')} tone="border-slate-200 text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Mostrar</Btn>
              : <Btn onClick={() => act(r.id, 'hide')} tone="border-slate-200 text-slate-700 hover:bg-slate-50"><EyeOff className="h-3.5 w-3.5" /> Ocultar</Btn>}
            {r.reported ? <Btn onClick={() => act(r.id, 'dismiss_report')} tone="border-amber-200 text-amber-700 hover:bg-amber-50"><Flag className="h-3.5 w-3.5" /> Dispensar</Btn> : null}
            <Btn onClick={() => act(r.id, 'delete')} tone="border-rose-200 text-rose-700 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Eliminar</Btn>
          </div>
        </div>
      ))}
      {rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Sem reviews.</div> : null}
    </div>
  );
}

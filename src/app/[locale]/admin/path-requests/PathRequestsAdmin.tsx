'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Route, Loader2, Check, X, Clock } from 'lucide-react';

function safeT(t: any, k: string, fb: string): string {
  try { const v = t(k); if (v && typeof v === 'string' && v !== k) return v; } catch {}
  return fb;
}

export function PathRequestsAdmin() {
  const t = useTranslations();
  const sb = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try { const { data } = await sb.rpc('nl_admin_path_requests_list', { p_status: filter }); if ((data as any)?.ok) setItems((data as any).items || []); } catch {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function decide(id: string, approve: boolean) {
    setBusy(id);
    try {
      const { data } = await sb.rpc('nl_admin_path_request_decide', { p_id: id, p_approve: approve, p_note: note[id] || null });
      if ((data as any)?.ok) { toast.success(safeT(t, 'path_req.decided', 'Decisão registada.')); load(); }
      else toast.error((data as any)?.error || 'erro');
    } catch { toast.error('erro'); }
    finally { setBusy(null); }
  }

  const TABS: [typeof filter, string][] = [['pending', 'path_req.status.pending'], ['approved', 'path_req.status.approved'], ['rejected', 'path_req.status.rejected'], ['all', 'path_req.all']];
  const STBADGE: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-rose-100 text-rose-700' };
  const STICON: Record<string, any> = { pending: Clock, approved: Check, rejected: X };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-brand-600 text-xs font-semibold uppercase tracking-wider mb-1"><Route className="h-3.5 w-3.5" />{safeT(t, 'shell.admin.path_requests', 'Pedidos de percurso')}</div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT(t, 'shell.admin.path_requests', 'Pedidos de percurso')}</h1>
        <p className="text-sm text-slate-600 mt-1.5">{safeT(t, 'path_req.admin_sub', 'Pedidos de percurso submetidos por instrutores.')}</p>
      </header>

      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(([id, k]) => (
          <button key={id} onClick={() => setFilter(id)} className={`px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors shrink-0 whitespace-nowrap ${filter === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{safeT(t, k, id)}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">{safeT(t, 'path_req.none_admin', 'Sem pedidos.')}</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((r: any) => { const Ic = STICON[r.status] || Clock; const pend = r.status === 'pending'; return (
            <div key={r.id} className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center shrink-0"><Route className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 leading-snug">{r.proposed_title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{safeT(t, 'path_req.by', 'por')} {r.requester_name}{r.proposed_category ? ` · ${r.proposed_category}` : ''}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STBADGE[r.status] || 'bg-slate-100 text-slate-600'}`}><Ic className="h-3 w-3" />{safeT(t, 'path_req.status.' + r.status, r.status)}</span>
                  </div>
                </div>
              </div>
              {r.proposed_description && <p className="text-sm text-slate-600 mt-2">{r.proposed_description}</p>}
              {r.rationale && <p className="text-xs text-slate-500 mt-1 italic">{r.rationale}</p>}
              {Array.isArray(r.courses) && r.courses.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">{r.courses.map((c: any) => <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{c.title}</span>)}</div>
              )}
              {r.admin_note && <p className="mt-2 text-xs text-slate-500">{safeT(t, 'path_req.note', 'Nota')}: {r.admin_note}</p>}
              {pend && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <input value={note[r.id] || ''} onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))} placeholder={safeT(t, 'path_req.note_ph', 'Nota (opcional)')} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-200" />
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => decide(r.id, false)} disabled={busy === r.id} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><X className="h-3.5 w-3.5" />{safeT(t, 'path_req.reject', 'Rejeitar')}</button>
                    <button onClick={() => decide(r.id, true)} disabled={busy === r.id} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{safeT(t, 'path_req.approve', 'Aprovar')}</button>
                  </div>
                </div>
              )}
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}

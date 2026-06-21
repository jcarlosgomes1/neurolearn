'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';

interface Item { course_id: string; title: string; status: string; instructor_name: string | null }

/** Aba Peer-review: estado e ativação da avaliação por pares deste curso. Reutiliza nl_admin_course_peer_requests/decide. */
export function CoursePeerPanel({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_course_peer_requests');
      if (error) throw error;
      const r = data as { ok?: boolean; items?: Item[] };
      setItem((r?.items || []).find((x) => x.course_id === courseId) || null);
    } catch { setItem(null); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { load(); }, [load]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_course_peer_decide', { p_course_id: courseId, p_approve: approve, p_note: null });
      if (error || !(data as { ok?: boolean })?.ok) throw new Error();
      setItem((x) => x ? { ...x, status: approve ? 'approved' : 'rejected' } : x);
      toast.success(approve ? t('course_ws.peer.activated') : t('course_ws.peer.rejected'));
    } catch { toast.error(t('course_ws.peer.error')); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (!item) return <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-400 text-center">{t('course_ws.peer.none')}</div>;

  const status = item.status || 'off';
  const badge = status === 'approved' ? 'bg-emerald-100 text-emerald-700' : status === 'requested' ? 'bg-amber-100 text-amber-700' : status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500';

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{t('course_ws.peer.title')}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>{t(`course_ws.peer.status.${status}` as never)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">{t('course_ws.peer.desc')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {status !== 'approved' && <button disabled={busy} onClick={() => decide(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{t('course_ws.peer.activate')}</button>}
            {status === 'approved' && <button disabled={busy} onClick={() => decide(false)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 disabled:opacity-50"><X className="h-3.5 w-3.5" />{t('course_ws.peer.deactivate')}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

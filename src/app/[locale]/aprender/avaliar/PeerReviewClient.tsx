'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Users2, Loader2, Send, CheckCircle2, Inbox } from 'lucide-react';

type Assignment = {
  id: string; status: string; assigned_at: string;
  title_md: string; prompt_md: string; rubric: any; max_score: number; submission: string;
};

export function PeerReviewClient() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('nl_peer_my_assignments');
      if (Array.isArray(data)) setItems(data as Assignment[]);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function patch(id: string, field: 'score' | 'feedback', value: string) {
    setDrafts((d) => ({ ...d, [id]: { score: d[id]?.score ?? '', feedback: d[id]?.feedback ?? '', [field]: value } }));
  }

  async function submit(a: Assignment) {
    const draft = drafts[a.id];
    const score = Number(draft?.score);
    if (!draft || isNaN(score) || score < 0 || score > a.max_score) { toast.error(t('peer.error')); return; }
    setSavingId(a.id);
    try {
      const { data, error } = await supabase.rpc('nl_peer_review_submit', {
        p_assignment_id: a.id, p_score: score, p_feedback: draft.feedback || null, p_rubric_scores: null,
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(t('peer.submitted'));
      setItems((xs) => xs.filter((x) => x.id !== a.id));
    } catch { toast.error(t('peer.error')); }
    finally { setSavingId(null); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <Users2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('peer.page_title')}</h1>
          <p className="text-sm text-slate-500">{t('peer.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
          <Inbox className="h-10 w-10 text-slate-300" />
          <span className="text-sm">{t('peer.empty')}</span>
        </div>
      ) : (
        <div className="space-y-5 mt-6">
          {items.map((a) => {
            const d = drafts[a.id];
            return (
              <div key={a.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-white">
                  <span className="text-sm font-semibold">{a.title_md}</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.prompt_md}</p>

                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t('peer.submission')}</label>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {a.submission}
                    </div>
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="w-28">
                      <label className="text-xs font-medium text-slate-500 mb-1 block">{t('peer.your_score')} (0–{a.max_score})</label>
                      <input type="number" min={0} max={a.max_score} value={d?.score ?? ''} onChange={(e) => patch(a.id, 'score', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t('peer.your_feedback')}</label>
                    <textarea value={d?.feedback ?? ''} onChange={(e) => patch(a.id, 'feedback', e.target.value)} placeholder={t('peer.feedback_ph')} rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 outline-none resize-y" />
                  </div>

                  <button onClick={() => submit(a)} disabled={savingId === a.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-violet-700">
                    {savingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {t('peer.submit')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

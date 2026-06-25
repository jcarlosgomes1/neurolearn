'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Star, MessageSquare, Loader2, CheckCircle2, Send } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

interface Review {
  id: string;
  course_id: string;
  course_title: string | null;
  rating: number | null;
  title: string | null;
  body: string | null;
  reviewer_name: string;
  instructor_response: string | null;
  instructor_responded_at: string | null;
  created_at: string;
  pending: boolean;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={i <= n ? 'w-3.5 h-3.5 fill-amber-400 text-amber-400' : 'w-3.5 h-3.5 text-slate-300'} />
      ))}
    </span>
  );
}

export function ReviewsClient() {
  const t = useTranslations();
  const locale = useLocale();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_instructor_reviews_list');
      if (error) throw error;
      setReviews((data as Review[]) || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openReply(r: Review) {
    setOpenId(r.id);
    setDraft(r.instructor_response || '');
  }

  async function submitReply(id: string) {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_instructor_review_respond', { p_review_id: id, p_response: draft.trim() });
      if (error) throw error;
      toast.success(t('teach.reviews.saved'));
      setOpenId(null);
      setDraft('');
      await load();
    } catch {
      toast.error(t('teach.reviews.error'));
    } finally {
      setSaving(false);
    }
  }

  const fmtDate = (s: string) => { try { return new Date(s).toLocaleDateString(locale); } catch { return ''; } };

  return (
    <div className="max-w-6xl mx-auto">
      <AppPageHeader  title={t('teach.reviews.title')} description={t('teach.reviews.description')} />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500 text-sm">{t('teach.reviews.empty')}</div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars n={r.rating || 0} />
                    <span className="text-sm font-medium text-slate-800 truncate">{r.reviewer_name}</span>
                    <span className="text-xs text-slate-400">- {r.course_title}</span>
                  </div>
                  {r.title ? <p className="mt-2 text-sm font-semibold text-slate-900">{r.title}</p> : null}
                  {r.body ? <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{r.body}</p> : null}
                  <p className="mt-1 text-[11px] text-slate-400">{fmtDate(r.created_at)}</p>
                </div>
                {r.pending ? (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium px-2.5 py-1">{t('teach.reviews.pending')}</span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-1"><CheckCircle2 className="w-3 h-3" />{t('teach.reviews.answered')}</span>
                )}
              </div>

              {r.instructor_response && openId !== r.id ? (
                <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">{t('teach.reviews.your_response')}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.instructor_response}</p>
                </div>
              ) : null}

              {openId === r.id ? (
                <div className="mt-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder={t('teach.reviews.response_ph')}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => submitReply(r.id)} disabled={saving || !draft.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800 transition">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {saving ? t('teach.reviews.saving') : t('teach.reviews.save')}
                    </button>
                    <button onClick={() => { setOpenId(null); setDraft(''); }} className="text-sm text-slate-500 px-3 py-2 hover:text-slate-700">{t('teach.reviews.cancel')}</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <button onClick={() => openReply(r)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 px-3.5 py-1.5 hover:bg-slate-50 transition">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    {r.instructor_response ? t('teach.reviews.edit') : t('teach.reviews.respond_cta')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

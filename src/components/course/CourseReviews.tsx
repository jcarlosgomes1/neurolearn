'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { Star, ThumbsUp, MessageSquare, Loader2, Award } from 'lucide-react';

export function CourseReviews({ courseId, currentUserId, isInstructor }: { courseId: string; currentUserId?: string; isInstructor?: boolean }) {
  const [data, setData] = useState<{ reviews: any[]; summary: any } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const sb = createClient();

  async function reload() {
    const { data: r } = await sb.rpc('nl_course_reviews_list', { p_course_id: courseId, p_limit: 20, p_offset: 0 });
    if ((r as any)?.ok) setData(r as any);
  }
  useEffect(() => { reload(); }, [courseId]);

  function vote(reviewId: string) {
    startTransition(async () => { assertNotPeekClient(); await sb.rpc('nl_review_helpful_toggle', { p_review_id: reviewId }); reload(); });
  }

  if (!data) return <div className="p-8 text-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Avaliações</h2>
          {data.summary?.total > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-xl font-bold text-slate-900">{data.summary.avg}</span>
              </div>
              <span className="text-sm text-slate-500">· {data.summary.total} avaliações</span>
            </div>
          )}
        </div>
        {currentUserId && !showForm && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            Escrever review
          </button>
        )}
      </div>

      {/* Rating breakdown */}
      {data.summary?.total > 0 && (
        <div className="space-y-1.5 mb-5 max-w-md">
          {[5, 4, 3, 2, 1].map((r) => {
            const count = data.summary.breakdown[r] || 0;
            const pct = (count / data.summary.total) * 100;
            return (
              <div key={r} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-slate-600">{r}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-2" style={{ width: pct + '%' }} />
                </div>
                <span className="w-10 text-slate-500 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <ReviewForm courseId={courseId} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); reload(); }} />}

      {data.reviews.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">Ainda sem avaliações. Sê o/a primeiro/a!</p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((r) => (
            <div key={r.id} className="border-t border-slate-100 pt-4">
              <div className="flex items-start gap-3">
                {r.author_avatar ? (
                  <img src={r.author_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-xs font-bold">
                    {r.author_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{r.author_name || 'Aluno'}</span>
                    {r.verified_purchase && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full">✓ Verificado</span>}
                    <span className="text-amber-500">{'★'.repeat(r.rating)}<span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span></span>
                    <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString('pt-PT')}</span>
                  </div>
                  {r.title && <p className="font-medium text-slate-800 text-sm mt-1">{r.title}</p>}
                  {r.body && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{r.body}</p>}
                  {(r.pros?.length > 0 || r.cons?.length > 0) && (
                    <div className="grid sm:grid-cols-2 gap-2 mt-2 text-xs">
                      {r.pros?.length > 0 && (
                        <div><div className="font-semibold text-emerald-700">👍 Prós</div><ul className="list-disc list-inside text-slate-600">{r.pros.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul></div>
                      )}
                      {r.cons?.length > 0 && (
                        <div><div className="font-semibold text-rose-700">👎 Contras</div><ul className="list-disc list-inside text-slate-600">{r.cons.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul></div>
                      )}
                    </div>
                  )}
                  {r.instructor_response && (
                    <div className="mt-3 bg-brand-50 border-l-4 border-brand-500 p-3 rounded">
                      <div className="text-xs font-semibold text-brand-900 mb-1 flex items-center gap-1"><Award className="h-3 w-3" /> Resposta do instrutor</div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.instructor_response}</p>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => vote(r.id)} disabled={pending}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-brand-700 hover:bg-slate-100 rounded">
                      <ThumbsUp className="h-3 w-3" /> Útil ({r.helpful_count})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewForm({ courseId, onClose, onSaved }: { courseId: string; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [consent, setConsent] = useState(false);
  const [pending, startTransition] = useTransition();
  const sb = createClient();

  function submit() {
    if (!rating) return;
    startTransition(async () => {
      assertNotPeekClient();
      await sb.rpc('nl_course_review_upsert', { p_course_id: courseId, p_rating: rating, p_title: title || null, p_body: body || null, p_consent_to_feature: consent });
      onSaved();
    });
  }

  return (
    <div className="mb-4 p-4 bg-slate-50 rounded-xl space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Rating</label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((r) => (
            <button key={r} onClick={() => setRating(r)} className="text-2xl">
              <Star className={`h-7 w-7 ${r <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resumo da tua experiência…"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Comentário</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="O que aprendeste, o que melhorarias…"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
      </div>
      <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        <span>Autorizo destacar publicamente esta avaliação com o meu nome e cargo (opcional; podes retirar quando quiseres).</span>
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
        <button onClick={submit} disabled={pending} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Publicar
        </button>
      </div>
    </div>
  );
}

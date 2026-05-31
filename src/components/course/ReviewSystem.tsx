'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Review {
  id: number;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_completion: boolean;
  helpful_count: number;
  created_at: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Stars({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-base', md: 'text-2xl', lg: 'text-3xl' };
  return (
    <div className={`inline-flex gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} disabled={!onChange} type="button"
          onClick={() => onChange?.(n)}
          className={`${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform leading-none`}
          aria-label={`${n} estrelas`}>
          <span className={n <= value ? 'text-amber-400' : 'text-slate-200'}>★</span>
        </button>
      ))}
    </div>
  );
}

export function ReviewSystem({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const sb = createClient();
    const [{ data: { user } }, allRes] = await Promise.all([
      sb.auth.getUser(),
      sb.from('nl_reviews').select('id, user_id, rating, title, body, is_verified_completion, helpful_count, created_at')
        .eq('course_id', courseId).eq('is_visible', true).order('created_at', { ascending: false }).limit(50),
    ]);
    const all = (allRes.data as Review[]) || [];
    setReviews(all);
    const mine = user ? all.find((r) => r.user_id === user.id) : null;
    if (mine) {
      setMyReview(mine);
      setRating(mine.rating); setTitle(mine.title || ''); setBody(mine.body || '');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [courseId]);

  async function submit() {
    if (rating < 1) { toast.error('Escolhe pelo menos 1 estrela'); return; }
    setSubmitting(true);
    const sb = createClient();
    const { data, error } = await sb.rpc('nl_submit_review', {
      p_course_id: courseId, p_rating: rating, p_title: title || null, p_body: body || null
    });
    if (error) toast.error(error.message);
    else {
      const result = (data as Array<{ ok: boolean; error_code: string }>)?.[0];
      if (result?.ok) {
        toast.success(myReview ? 'Review actualizada' : 'Obrigado pela tua avaliação!');
        setEditing(false);
        await load();
      } else toast.error(result?.error_code || 'Falha');
    }
    setSubmitting(false);
  }

  if (loading) return <div className="text-center py-8 text-slate-400">A carregar avaliações...</div>;

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star, count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <section className="mt-10 pt-8 border-t border-slate-100">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Avaliações deste curso</h2>
      <p className="text-sm text-slate-500 mb-6">Sinal honesto dos alunos. Para rever precisas de ter completado ≥80% das aulas.</p>

      {/* Sumário */}
      {reviews.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="text-center sm:border-r sm:border-slate-100 sm:pr-6">
              <div className="text-5xl font-bold text-amber-500 tabular-nums">{avg.toFixed(1)}</div>
              <Stars value={Math.round(avg)} size="md" />
              <div className="text-xs text-slate-500 mt-1">{reviews.length} avaliaç{reviews.length === 1 ? 'ão' : 'ões'}</div>
            </div>
            <div className="space-y-1.5">
              {distribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 tabular-nums text-slate-500">{star}</span>
                  <span className="text-amber-400">★</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right tabular-nums text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center mb-6">
          <div className="text-3xl mb-2">⭐</div>
          <p className="text-sm text-slate-600">Sê o primeiro a avaliar este curso.</p>
        </div>
      )}

      {/* O meu review (form ou view) */}
      <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-200 rounded-2xl p-5 sm:p-6 mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-700 mb-3">
          {myReview ? '🌟 A minha avaliação' : '✍️ Avaliar este curso'}
        </h3>
        {!editing && myReview ? (
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Stars value={myReview.rating} />
              {myReview.is_verified_completion && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✓ Concluído</span>}
            </div>
            {myReview.title && <h4 className="mt-3 font-bold text-slate-900">{myReview.title}</h4>}
            {myReview.body && <p className="mt-2 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{myReview.body}</p>}
            <button onClick={() => setEditing(true)} className="mt-3 text-sm text-brand-600 hover:underline font-medium">Editar avaliação</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Pontuação</label>
              <div className="mt-1"><Stars value={rating} onChange={setRating} size="lg" /></div>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Título (opcional)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                placeholder='Ex: "Mudou a minha forma de trabalhar"' className="mt-1 w-full p-2.5 border-2 border-slate-200 focus:border-brand-400 rounded-lg outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Comentário (opcional)</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={2000}
                placeholder="O que aprendeste? Para quem recomendarias?" className="mt-1 w-full p-2.5 border-2 border-slate-200 focus:border-brand-400 rounded-lg outline-none text-sm leading-relaxed" />
            </div>
            <div className="flex gap-2 justify-end">
              {editing && <button onClick={() => { setEditing(false); if (myReview) { setRating(myReview.rating); setTitle(myReview.title || ''); setBody(myReview.body || ''); } }} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2">Cancelar</button>}
              <button onClick={submit} disabled={submitting || rating < 1} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow">
                {submitting ? 'A enviar...' : myReview ? '✓ Actualizar' : '✓ Publicar avaliação'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.filter((r) => r.id !== myReview?.id).map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Stars value={r.rating} size="sm" />
                  {r.is_verified_completion && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Concluído</span>}
                </div>
                <span className="text-xs text-slate-400">{fmtDate(r.created_at)}</span>
              </div>
              {r.title && <h4 className="font-bold text-slate-900">{r.title}</h4>}
              {r.body && <p className={`text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ${r.title ? 'mt-2' : ''}`}>{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

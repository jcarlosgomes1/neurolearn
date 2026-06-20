'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Layers, RotateCcw, Check } from 'lucide-react';

interface Card { id: string; front: string; back: string; hint?: string | null; state?: string }

export function FlashcardStudy({ courseId, moduleIndex, lessonIndex }: { courseId: string; moduleIndex: number; lessonIndex: number }) {
  const t = useTranslations('study');
  const [cards, setCards] = useState<Card[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [grading, setGrading] = useState(false);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_flashcards_for_lesson', { p_course_id: courseId, p_m: moduleIndex, p_l: lessonIndex });
      if (error) throw error;
      const r = data as { ok?: boolean; cards?: Card[] };
      setCards(r?.ok ? (r.cards || []) : []);
    } catch { setCards([]); }
  }, [courseId, moduleIndex, lessonIndex]);

  useEffect(() => { load(); }, [load]);

  async function grade(g: number) {
    if (!cards || grading) return;
    const card = cards[idx];
    setGrading(true);
    try {
      const sb = createClient();
      await sb.rpc('nl_flashcard_grade', { p_flashcard_id: card.id, p_grade: g });
    } catch { /* noop */ }
    setGrading(false);
    setRevealed(false);
    if (idx + 1 >= cards.length) { setDone(true); } else { setIdx(idx + 1); }
  }

  function restart() { setIdx(0); setRevealed(false); setDone(false); }

  if (!cards || cards.length === 0) return null;

  const total = cards.length;
  const card = cards[idx];

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <header className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Layers className="h-5 w-5" /></span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{t('eyebrow')}</p>
          <h3 className="font-display text-lg font-bold text-slate-900 leading-tight">{t('title')}</h3>
        </div>
        {!done && <span className="text-xs text-slate-400 font-medium tabular-nums">{t('progress', { n: idx + 1, total })}</span>}
      </header>

      {done ? (
        <div className="px-5 py-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3"><Check className="h-6 w-6" /></span>
          <p className="font-display text-lg font-bold text-slate-900">{t('done_title')}</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{t('done_sub')}</p>
          <button onClick={restart} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <RotateCcw className="h-4 w-4" /> {t('restart')}
          </button>
        </div>
      ) : (
        <div className="p-5">
          <div className="min-h-[120px] rounded-xl bg-slate-50 border border-slate-100 p-5 flex flex-col items-center justify-center text-center">
            <p className="text-base font-medium text-slate-900 text-balance">{card.front}</p>
            {revealed && (
              <div className="mt-4 pt-4 border-t border-slate-200 w-full animate-in fade-in duration-200">
                <p className="text-sm text-slate-700 leading-relaxed text-pretty">{card.back}</p>
                {card.hint && <p className="text-xs text-slate-400 mt-2">{t('hint')}: {card.hint}</p>}
              </div>
            )}
          </div>

          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="mt-4 w-full rounded-xl bg-slate-900 text-white text-sm font-semibold py-3 hover:bg-slate-800 transition-colors active:scale-[0.99]">
              {t('show_answer')}
            </button>
          ) : (
            <div className="mt-4 grid grid-cols-4 gap-2">
              <button disabled={grading} onClick={() => grade(0)} className="rounded-xl py-2.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors">{t('again')}</button>
              <button disabled={grading} onClick={() => grade(1)} className="rounded-xl py-2.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors">{t('hard')}</button>
              <button disabled={grading} onClick={() => grade(2)} className="rounded-xl py-2.5 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 transition-colors">{t('good')}</button>
              <button disabled={grading} onClick={() => grade(3)} className="rounded-xl py-2.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors">{t('easy')}</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

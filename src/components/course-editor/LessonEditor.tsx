'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { toast } from 'sonner';
import { useAIFeatures } from '@/lib/hooks/useAIFeatures';
import type { Lesson } from './ModulesEditor';

interface Props {
  course: { id: string; title: string; level: string };
  moduleName: string;
  lesson: Lesson;
  lessonIndex: number;
  totalLessons: number;
  prevLesson?: string;
  nextLesson?: string;
  onUpdate: (patch: Partial<Lesson>) => void;
  onDelete: () => void;
  onBack: () => void;
}

export function LessonEditor({ course, moduleName, lesson, lessonIndex, totalLessons, prevLesson, nextLesson, onUpdate, onDelete, onBack }: Props) {
  const t = useTranslations('lesson_editor');
  const TYPE_OPTIONS = [
    { v: 'reading' as const, label: t('type.reading'), emoji: '📖' },
    { v: 'video' as const, label: t('type.video'), emoji: '🎬' },
    { v: 'exercise' as const, label: t('type.exercise'), emoji: '✍️' },
  ];
  const [generating, setGenerating] = useState(false);
  const { features, isAdmin, loading: featLoading, refetch: refetchFeatures } = useAIFeatures();
  const canGenerate = isAdmin || (features?.can_generate_lessons === true);
  const creditsLeft = isAdmin ? Infinity : Math.max(0, (features?.monthly_ai_credits || 0) - (features?.credits_used_this_month || 0));
  const c = lesson.content || {};

  async function generateWithAI() {
    if (!lesson.title.trim()) { toast.error(t('title_required')); return; }
    setGenerating(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      assertNotPeekClient();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({
          courseTitle: course.title, courseLevel: course.level,
          lessonTitle: lesson.title, lessonModule: moduleName,
          lessonType: lesson.type, lessonIdx: lessonIndex, totalLessons,
          prevCtx: prevLesson, nextCtx: nextLesson,
          lessonDuration: String(lesson.duration_minutes || 30), lang: 'pt',
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || t('gen_failure'));
      onUpdate({ content: data.content });
      refetchFeatures();
      if (typeof data.remaining_credits === 'number' && !isAdmin) {
        toast.success(t('generated_with_credits', { n: data.remaining_credits }));
      } else {
        toast.success(t('generated'));
      }
    } catch (e: any) { toast.error(e.message); } finally { setGenerating(false); }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm text-brand-600 hover:underline">{t('back')}</button>
        <button onClick={onDelete} className="text-xs text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md">{t('delete')}</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 text-lg">{t('details')}</h2>
        <div>
          <label className="label">{t('title')}</label>
          <input className="input" value={lesson.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder={t('title_ph')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t('type_label')}</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button key={opt.v} type="button" onClick={() => onUpdate({ type: opt.v })} className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all ${lesson.type === opt.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300'}`}>
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('duration')}</label>
            <input type="number" min="5" step="5" className="input" value={lesson.duration_minutes || 30} onChange={(e) => onUpdate({ duration_minutes: parseInt(e.target.value) || 30 })} />
          </div>
        </div>
      </div>

      {featLoading ? null : !canGenerate ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔒</span>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-700 text-base">{t('locked_title')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('locked_desc')}</p>
          </div>
        </div>
      ) : creditsLeft <= 0 && !isAdmin ? (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">⏱</span>
          <div className="min-w-0">
            <h2 className="font-semibold text-amber-900 text-base">{t('no_credits_title')}</h2>
            <p className="text-sm text-amber-700 mt-1">{t('no_credits_desc', { n: features?.monthly_ai_credits || 0 })}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl border border-brand-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">{t('gen_section_title')}</h2>
              <p className="text-sm text-slate-600 mt-1">{t('gen_section_desc')}</p>
              {!isAdmin && features && (
                <p className="text-xs text-slate-500 mt-2 tabular-nums">{t('credits_info', { left: creditsLeft, total: features.monthly_ai_credits })}</p>
              )}
            </div>
            <button onClick={generateWithAI} disabled={generating} className="btn-primary disabled:opacity-50 flex-shrink-0">
              {generating ? t('generating') : c.p?.length ? t('regenerate') : t('generate')}
            </button>
          </div>
          {generating && <p className="text-xs text-slate-500 mt-3">{t('generating_hint')}</p>}
        </div>
      )}

      {c.p?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('paragraphs', { n: c.p.length })}</h3>
            <div className="space-y-2">
              {c.p.map((p, i) => (
                <textarea key={i} className="input min-h-[80px]" value={p} onChange={(e) => onUpdate({ content: { ...c, p: c.p!.map((x, j) => j === i ? e.target.value : x) } })} />
              ))}
            </div>
          </div>
          {c.kp?.length ? (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('key_points')}</h3>
              <ul className="space-y-1.5">
                {c.kp.map((k, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-brand-500 mt-1">✓</span>
                    <input className="input flex-1" value={k} onChange={(e) => onUpdate({ content: { ...c, kp: c.kp!.map((x, j) => j === i ? e.target.value : x) } })} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {c.code ? (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('code_example')}</h3>
              <textarea className="input font-mono text-sm min-h-[120px] bg-slate-900 text-slate-100 border-slate-700" value={c.code} onChange={(e) => onUpdate({ content: { ...c, code: e.target.value } })} />
            </div>
          ) : null}
          {c.tip ? (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('tip')}</h3>
              <textarea className="input min-h-[60px] bg-amber-50 border-amber-200" value={c.tip} onChange={(e) => onUpdate({ content: { ...c, tip: e.target.value } })} />
            </div>
          ) : null}
          {c.q?.q ? (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('quiz')}</h3>
              <div className="bg-purple-50 rounded-lg p-4 space-y-3 border border-purple-200">
                <input className="input bg-white" value={c.q.q} onChange={(e) => onUpdate({ content: { ...c, q: { ...c.q, q: e.target.value } } })} placeholder={t('question_ph')} />
                {(c.q.o || []).map((o: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={c.q.c === i} onChange={() => onUpdate({ content: { ...c, q: { ...c.q, c: i } } })} />
                    <input className="input bg-white flex-1" value={o} onChange={(e) => onUpdate({ content: { ...c, q: { ...c.q, o: c.q.o.map((x: string, j: number) => j === i ? e.target.value : x) } } })} />
                  </div>
                ))}
                {c.q.e && <textarea className="input bg-white text-xs" value={c.q.e} onChange={(e) => onUpdate({ content: { ...c, q: { ...c.q, e: e.target.value } } })} placeholder={t('explanation_ph')} />}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-sm text-slate-500">{t('empty_state')}</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
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

const TYPE_OPTIONS = [
  { v: 'reading' as const, label: 'Leitura', emoji: '📖' },
  { v: 'video' as const, label: 'Vídeo', emoji: '🎬' },
  { v: 'exercise' as const, label: 'Exercício', emoji: '✍️' },
];

export function LessonEditor({ course, moduleName, lesson, lessonIndex, totalLessons, prevLesson, nextLesson, onUpdate, onDelete, onBack }: Props) {
  const [generating, setGenerating] = useState(false);
  const { features, isAdmin, loading: featLoading, refetch: refetchFeatures } = useAIFeatures();
  const canGenerate = isAdmin || (features?.can_generate_lessons === true);
  const creditsLeft = isAdmin ? Infinity : Math.max(0, (features?.monthly_ai_credits || 0) - (features?.credits_used_this_month || 0));
  const c = lesson.content || {};

  async function generateWithAI() {
    if (!lesson.title.trim()) { toast.error('Define o título da aula primeiro'); return; }
    setGenerating(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
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
      if (!data.ok) throw new Error(data.error || 'Falha ao gerar conteúdo');
      onUpdate({ content: data.content });
      refetchFeatures();
      if (typeof data.remaining_credits === 'number' && !isAdmin) {
        toast.success(`Conteúdo gerado! 🎉 (${data.remaining_credits} créditos restantes)`);
      } else {
        toast.success('Conteúdo gerado! 🎉');
      }
    } catch (e: any) { toast.error(e.message); } finally { setGenerating(false); }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm text-brand-600 hover:underline">← Voltar aos módulos</button>
        <button onClick={onDelete} className="text-xs text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md">Apagar aula</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 text-lg">Detalhes da aula</h2>
        <div>
          <label className="label">Título</label>
          <input className="input" value={lesson.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Ex: Estruturar prompts eficazes" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button key={t.v} type="button" onClick={() => onUpdate({ type: t.v })} className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all ${lesson.type === t.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300'}`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Duração (minutos)</label>
            <input type="number" min="5" step="5" className="input" value={lesson.duration_minutes || 30} onChange={(e) => onUpdate({ duration_minutes: parseInt(e.target.value) || 30 })} />
          </div>
        </div>
      </div>

      {featLoading ? null : !canGenerate ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔒</span>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-700 text-base">Geração com IA não está activada</h2>
            <p className="text-sm text-slate-500 mt-1">Pede ao admin para activar a funcionalidade <strong>"Gerar conteúdo de aulas"</strong> no teu perfil de instrutor para gerar parágrafos, key points, código e quiz automaticamente.</p>
          </div>
        </div>
      ) : creditsLeft <= 0 && !isAdmin ? (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">⏱</span>
          <div className="min-w-0">
            <h2 className="font-semibold text-amber-900 text-base">Sem créditos AI este mês</h2>
            <p className="text-sm text-amber-700 mt-1">Esgotaste os {features?.monthly_ai_credits} créditos mensais. Pede ao admin mais créditos ou aguarda o reset no próximo mês.</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl border border-brand-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">🧠 Conteúdo da aula</h2>
              <p className="text-sm text-slate-600 mt-1">Gera parágrafos, key points, código exemplo, dica e quiz com base no título e contexto do curso.</p>
              {!isAdmin && features && (
                <p className="text-xs text-slate-500 mt-2"><strong className="tabular-nums">{creditsLeft}</strong> de {features.monthly_ai_credits} créditos restantes este mês · 1 crédito por geração</p>
              )}
            </div>
            <button onClick={generateWithAI} disabled={generating} className="btn-primary disabled:opacity-50 flex-shrink-0">
              {generating ? '⏳ A gerar...' : c.p?.length ? '🔄 Regenerar com IA' : '✨ Gerar com IA'}
            </button>
          </div>
          {generating && <p className="text-xs text-slate-500 mt-3">Pode demorar 10-20 segundos. Estamos a usar o Claude para preparar conteúdo específico para esta aula.</p>}
        </div>
      )}

      {c.p?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Parágrafos ({c.p.length})</h3>
            <div className="space-y-2">
              {c.p.map((p, i) => (
                <textarea key={i} className="input min-h-[80px]" value={p} onChange={(e) => onUpdate({ content: { ...c, p: c.p!.map((x, j) => j === i ? e.target.value : x) } })} />
              ))}
            </div>
          </div>
          {c.kp?.length ? (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key points</h3>
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
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Exemplo de código</h3>
              <textarea className="input font-mono text-sm min-h-[120px] bg-slate-900 text-slate-100 border-slate-700" value={c.code} onChange={(e) => onUpdate({ content: { ...c, code: e.target.value } })} />
            </div>
          ) : null}
          {c.tip ? (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dica do instrutor</h3>
              <textarea className="input min-h-[60px] bg-amber-50 border-amber-200" value={c.tip} onChange={(e) => onUpdate({ content: { ...c, tip: e.target.value } })} />
            </div>
          ) : null}
          {c.q?.q ? (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quiz</h3>
              <div className="bg-purple-50 rounded-lg p-4 space-y-3 border border-purple-200">
                <input className="input bg-white" value={c.q.q} onChange={(e) => onUpdate({ content: { ...c, q: { ...c.q, q: e.target.value } } })} placeholder="Pergunta" />
                {(c.q.o || []).map((o: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={c.q.c === i} onChange={() => onUpdate({ content: { ...c, q: { ...c.q, c: i } } })} />
                    <input className="input bg-white flex-1" value={o} onChange={(e) => onUpdate({ content: { ...c, q: { ...c.q, o: c.q.o.map((x: string, j: number) => j === i ? e.target.value : x) } } })} />
                  </div>
                ))}
                {c.q.e && <textarea className="input bg-white text-xs" value={c.q.e} onChange={(e) => onUpdate({ content: { ...c, q: { ...c.q, e: e.target.value } } })} placeholder="Explicação" />}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-sm text-slate-500">Esta aula ainda não tem conteúdo. Carrega em <strong>Gerar com IA</strong> acima para criar parágrafos, key points e quiz.</p>
        </div>
      )}
    </div>
  );
}

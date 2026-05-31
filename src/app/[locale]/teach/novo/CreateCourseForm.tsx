'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type Phase = 'prompt' | 'configuring' | 'generating' | 'review';

interface GenJob {
  id: string;
  course_id: string;
  status: string;
  progress_total: number;
  progress_done: number;
  current_step: string;
  error_message: string | null;
}

interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  emoji: string | null;
  category: string | null;
  level: string | null;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    lessons: Array<{ id: string; title: string; type: string; duration_minutes: number }>;
  }>;
  hero_image_url: string | null;
}

const LEVELS: Array<['beginner'|'intermediate'|'advanced', string, string]> = [
  ['beginner', 'Iniciante', 'Sem pré-requisitos'],
  ['intermediate', 'Intermédio', 'Já tem alguma base'],
  ['advanced', 'Avançado', 'Domínio sólido'],
];
const DURATIONS: Array<[string, string, number, number]> = [
  ['short', 'Curto · ~2h', 3, 3],
  ['medium', 'Médio · ~5h', 5, 4],
  ['long', 'Profundo · ~10h', 7, 5],
];
const TONES: Array<['didactic'|'practical'|'technical'|'inspirational', string]> = [
  ['didactic', 'Didáctico'],
  ['practical', 'Prático'],
  ['technical', 'Técnico'],
  ['inspirational', 'Inspirador'],
];
const EMOJIS = ['📘','🤖','🧠','💡','📊','🎨','⚙️','🚀','📈','🔬','💬','🎯','🛠','✨'];

export function CreateCourseForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('prompt');
  const [prompt, setPrompt] = useState('');
  const [level, setLevel] = useState<'beginner'|'intermediate'|'advanced'>('intermediate');
  const [duration, setDuration] = useState('medium');
  const [tone, setTone] = useState<'didactic'|'practical'|'technical'|'inspirational'>('practical');
  const [includeVideo, setIncludeVideo] = useState(false);
  const [includeExercises, setIncludeExercises] = useState(true);

  const [job, setJob] = useState<GenJob | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);

  // Poll status durante generation
  useEffect(() => {
    if (phase !== 'generating' || !job) return;
    const interval = setInterval(async () => {
      try {
        const sb = createClient();
        const { data } = await sb.from('nl_course_generation_jobs').select('*').eq('id', job.id).single();
        if (!data) return;
        setJob(data as GenJob);
        if (data.status === 'completed') {
          const { data: c } = await sb.from('nl_courses').select('id, title, subtitle, description, emoji, category, level, modules, hero_image_url').eq('id', job.course_id).single();
          if (c) setCourse(c as Course);
          setPhase('review');
          clearInterval(interval);
        } else if (data.status === 'failed') {
          toast.error('Falha: ' + (data.error_message || 'erro desconhecido'));
          setPhase('configuring');
          clearInterval(interval);
        }
      } catch (e) { console.error(e); }
    }, 2500);
    return () => clearInterval(interval);
  }, [phase, job]);

  async function startGeneration() {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error('Descreve com pelo menos 10 caracteres');
      return;
    }
    setPhase('generating');
    setJob({ id: 'pending', course_id: 'pending', status: 'pending', progress_total: 0, progress_done: 0, current_step: 'A iniciar...', error_message: null });

    const dur = DURATIONS.find((d) => d[0] === duration) || DURATIONS[1];
    const formats: ('reading'|'video'|'exercise')[] = ['reading'];
    if (includeVideo) formats.push('video');
    if (includeExercises) formats.push('exercise');

    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { toast.error('Sessão expirou'); setPhase('configuring'); return; }
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-full-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          config: {
            topic: prompt.trim(),
            level,
            num_modules: dur[2],
            lessons_per_module: dur[3],
            avg_lesson_minutes: 25,
            tone,
            depth: duration === 'long' ? 'extensive' : duration === 'short' ? 'summary' : 'normal',
            formats,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            category: 'ai',
            course_type: 'ai_generated',
            language: 'pt',
          },
        }),
      });
      const data = await resp.json();
      if (!data.ok) {
        toast.error(data.error || 'Falha ao iniciar geração');
        setPhase('configuring');
        return;
      }
      setJob({ id: data.job_id, course_id: data.course_id, status: 'pending', progress_total: 0, progress_done: 0, current_step: 'A criar estrutura...', error_message: null });
    } catch (e: any) {
      toast.error(e.message);
      setPhase('configuring');
    }
  }

  async function saveCourseMeta(updates: Partial<Course>) {
    if (!course) return;
    setSavingMeta(true);
    const sb = createClient();
    const { error } = await sb.from('nl_courses').update(updates).eq('id', course.id);
    if (error) toast.error(error.message);
    else { setCourse({ ...course, ...updates }); toast.success('Guardado'); }
    setSavingMeta(false);
  }

  async function publishOrSubmit() {
    if (!course) return;
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile && ['admin','super_admin'].includes(profile.role);
    const { error } = await sb.from('nl_courses').update({
      approval_status: isAdmin ? 'approved' : 'pending_review',
      published: isAdmin,
    }).eq('id', course.id);
    if (error) { toast.error(error.message); return; }
    toast.success(isAdmin ? 'Curso publicado!' : 'Submetido para aprovação. Recebes resposta por email.');
    router.push(`/teach/curso/${course.id}` as any);
  }

  // === FASE 1: PROMPT ===
  if (phase === 'prompt') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-4">✨ Criar curso com IA</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">O que queres ensinar?</h1>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">Descreve em linguagem natural. Quanto mais específico, melhor.</p>
        </div>

        <textarea
          value={prompt} onChange={(e) => setPrompt(e.target.value)}
          autoFocus
          placeholder='Ex: "Como usar o Claude para escrever propostas comerciais em PT-PT, com prompts prontos a copiar e exemplos do antes-depois. Para vendedores e consultores."'
          rows={6}
          className="w-full p-5 text-base bg-white border-2 border-slate-200 focus:border-brand-500 rounded-2xl outline-none resize-none transition-colors leading-relaxed"
        />
        <div className="mt-2 text-xs text-slate-400 text-right tabular-nums">{prompt.length} caracteres · min 10</div>

        <button onClick={() => setPhase('configuring')} disabled={prompt.trim().length < 10}
          className="mt-6 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl text-base transition-all shadow-sm">
          Continuar →
        </button>

        <div className="mt-8 text-center text-xs text-slate-400">
          A IA gera estrutura completa, módulos, aulas com conteúdo, quiz, dicas e imagens. Tu revês e ajustas tudo antes de publicar.
        </div>
      </div>
    );
  }

  // === FASE 2: CONFIG RÁPIDA ===
  if (phase === 'configuring') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-6">
        <div>
          <button onClick={() => setPhase('prompt')} className="text-sm text-slate-500 hover:text-slate-900">← Mudar descrição</button>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Afina a geração</h2>
          <p className="text-sm text-slate-500 mt-1">Estas escolhas guiam a IA. Tudo é editável depois.</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">A tua descrição</div>
          <p className="text-sm text-slate-700 leading-relaxed">{prompt}</p>
        </div>

        <Section title="Nível dos alunos">
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map(([v, l, hint]) => (
              <button key={v} onClick={() => setLevel(v)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${level === v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="font-semibold text-sm text-slate-900">{l}</div>
                <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Profundidade">
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map(([v, l, mods, aulas]) => (
              <button key={v} onClick={() => setDuration(v)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${duration === v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="font-semibold text-sm text-slate-900">{l}</div>
                <div className="text-xs text-slate-500 mt-0.5 tabular-nums">{mods} módulos × {aulas} aulas</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Tom de comunicação">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONES.map(([v, l]) => (
              <button key={v} onClick={() => setTone(v)}
                className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${tone === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Tipos de aula">
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
              <input type="checkbox" checked readOnly className="w-5 h-5 rounded text-brand-600 accent-brand-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-900">📖 Leitura</div>
                <div className="text-xs text-slate-500">Sempre incluída — base da aula</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
              <input type="checkbox" checked={includeVideo} onChange={(e) => setIncludeVideo(e.target.checked)} className="w-5 h-5 rounded text-brand-600 accent-brand-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-900">🎬 Vídeo</div>
                <div className="text-xs text-slate-500">Algumas aulas em formato vídeo</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
              <input type="checkbox" checked={includeExercises} onChange={(e) => setIncludeExercises(e.target.checked)} className="w-5 h-5 rounded text-brand-600 accent-brand-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-900">✍️ Exercícios</div>
                <div className="text-xs text-slate-500">Aulas práticas com tarefas concretas</div>
              </div>
            </label>
          </div>
        </Section>

        <div className="pt-2">
          <button onClick={startGeneration} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-2xl text-base shadow">
            ✨ Gerar curso completo com IA
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">Geração leva 1-3 minutos. Aguarda nesta página.</p>
        </div>
      </div>
    );
  }

  // === FASE 3: GENERATING ===
  if (phase === 'generating') {
    const pct = job && job.progress_total > 0 ? Math.round((job.progress_done / job.progress_total) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="text-6xl mb-6 animate-pulse">🧠</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">A construir o teu curso...</h2>
        <p className="text-sm text-slate-500 mb-8">{job?.current_step || 'A iniciar...'}</p>

        {job && job.progress_total > 0 && (
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-500 tabular-nums">{job.progress_done} / {job.progress_total} aulas geradas · {pct}%</div>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          A IA primeiro desenha a estrutura completa para garantir que as aulas se complementam. Depois gera cada aula com contexto da anterior e da seguinte para manter coerência.
        </p>
      </div>
    );
  }

  // === FASE 4: REVIEW ===
  if (phase === 'review' && course) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              ✓ Gerado
            </span>
            <span className="text-xs text-slate-400">Edita o que quiseres antes de publicar</span>
          </div>
        </div>

        {course.hero_image_url && (
          <div className="rounded-2xl overflow-hidden mb-6 aspect-[21/9] bg-slate-100">
            <img src={course.hero_image_url} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}

        <EditableField label="Título" value={course.title} onSave={(v) => saveCourseMeta({ title: v })} large saving={savingMeta} />
        <EditableField label="Subtítulo" value={course.subtitle || ''} onSave={(v) => saveCourseMeta({ subtitle: v })} saving={savingMeta} />
        <EditableField label="Descrição" value={course.description || ''} onSave={(v) => saveCourseMeta({ description: v })} multiline saving={savingMeta} />

        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">📚 Módulos e aulas ({course.modules.length} módulos · {course.modules.reduce((s,m) => s + m.lessons.length, 0)} aulas)</h3>
          <div className="space-y-3">
            {course.modules.map((mod, mi) => (
              <details key={mod.id || mi} className="bg-white border border-slate-200 rounded-xl overflow-hidden group">
                <summary className="px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">{mi + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate">{mod.title}</div>
                    <div className="text-xs text-slate-500">{mod.lessons.length} aulas</div>
                  </div>
                  <span className="text-slate-400 text-xs group-open:rotate-90 transition-transform">▶</span>
                </summary>
                <div className="border-t border-slate-100 bg-slate-50/50">
                  {mod.lessons.map((l, li) => (
                    <div key={l.id || li} className="px-4 py-2.5 border-b border-slate-100 last:border-0 flex items-center gap-3 text-sm">
                      <span className="text-xs text-slate-400 font-mono tabular-nums w-6">{li + 1}.</span>
                      <span className="flex-1 text-slate-700 truncate">{l.title}</span>
                      <span className="text-xs text-slate-400">{l.duration_minutes}min</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <button onClick={() => router.push(`/teach/curso/${course.id}` as any)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl border-2 border-slate-200">
            Continuar a editar
          </button>
          <button onClick={publishOrSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow">
            ✓ Publicar / Submeter
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function EditableField({ label, value, onSave, multiline, large, saving }: {
  label: string; value: string; onSave: (v: string) => void; multiline?: boolean; large?: boolean; saving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (!editing) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          <button onClick={() => setEditing(true)} className="text-xs text-brand-600 hover:underline">Editar</button>
        </div>
        <div className={`${large ? 'text-2xl sm:text-3xl font-bold text-slate-900 leading-tight' : multiline ? 'text-slate-700 leading-relaxed whitespace-pre-wrap' : 'text-slate-900 font-medium'}`}>{value || <span className="text-slate-400 italic font-normal text-base">(vazio — clica em Editar)</span>}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {multiline ? (
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} className="mt-1 w-full p-3 border-2 border-brand-300 rounded-xl outline-none focus:border-brand-500" autoFocus />
      ) : (
        <input value={draft} onChange={(e) => setDraft(e.target.value)} className={`mt-1 w-full p-3 border-2 border-brand-300 rounded-xl outline-none focus:border-brand-500 ${large ? 'text-xl font-bold' : ''}`} autoFocus />
      )}
      <div className="mt-2 flex gap-2 justify-end">
        <button onClick={() => { setDraft(value); setEditing(false); }} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5">Cancelar</button>
        <button onClick={() => { onSave(draft); setEditing(false); }} disabled={saving} className="text-sm bg-brand-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 font-semibold">
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

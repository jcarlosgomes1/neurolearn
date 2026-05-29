'use client';

import { useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const EMOJIS = ['📚','🤖','🧠','💡','📊','🎨','⚙️','🚀','📈','🔬','💬','🎯','📝','🎓','🛠','🔮','💼','🌐'];

const LEVELS = [
  { v: 'beginner', label: 'Iniciante', desc: 'Assume zero conhecimento' },
  { v: 'intermediate', label: 'Intermédio', desc: 'Bases já assumidas' },
  { v: 'advanced', label: 'Avançado', desc: 'Profundidade técnica' },
];

const TONES = [
  { v: 'didactic', label: 'Didático', emoji: '🎓', desc: 'Professor experiente, passo a passo' },
  { v: 'technical', label: 'Técnico', emoji: '⚙️', desc: 'Rigoroso, terminologia precisa' },
  { v: 'practical', label: 'Prático', emoji: '🛠', desc: 'Hands-on, orientado à ação' },
  { v: 'inspirational', label: 'Inspirador', emoji: '✨', desc: 'Casos reais, motivador' },
];

const DEPTHS = [
  { v: 'summary', label: 'Resumido', desc: '2-3 parágrafos por aula' },
  { v: 'normal', label: 'Normal', desc: '4-6 parágrafos por aula' },
  { v: 'extensive', label: 'Extensivo', desc: '6-10 parágrafos por aula' },
];

const COURSE_TYPES = [
  { v: 'essential', label: 'AI Essential', desc: 'Curso grátis curado pela equipa' },
  { v: 'ai_generated', label: 'AI Generated', desc: 'Curso pago sem instrutor humano' },
];

const FORMATS = [
  { v: 'reading', label: 'Leitura', emoji: '📖' },
  { v: 'video', label: 'Vídeo', emoji: '🎬' },
  { v: 'exercise', label: 'Exercício', emoji: '✍️' },
];

const LANGUAGES = [
  { v: 'pt', label: 'Português (PT)' },
  { v: 'en', label: 'English' },
  { v: 'es', label: 'Español' },
  { v: 'fr', label: 'Français' },
];

function suggestPrice(numModules: number, lessonsPerModule: number, avgMinutes: number, level: string, courseType: string): number {
  if (courseType === 'essential') return 0;
  // Heurística: base por hora × multiplicador de nível
  const totalHours = (numModules * lessonsPerModule * avgMinutes) / 60;
  const levelMult: Record<string, number> = { beginner: 1, intermediate: 1.3, advanced: 1.7 };
  const baseHourPrice = 15; // €15/hora de conteúdo
  const raw = totalHours * baseHourPrice * (levelMult[level] || 1);
  // Arredonda para o próximo .99 ou .49
  const rounded = Math.max(19, Math.round(raw / 10) * 10 - 1);
  return Math.min(rounded, 299);
}

export function CourseGeneratorForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Config state
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('pt');
  const [emoji, setEmoji] = useState('📚');
  const [category, setCategory] = useState('ai');
  const [courseType, setCourseType] = useState<'essential' | 'ai_generated'>('essential');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [tone, setTone] = useState<'didactic' | 'technical' | 'practical' | 'inspirational'>('didactic');
  const [depth, setDepth] = useState<'summary' | 'normal' | 'extensive'>('normal');
  const [numModules, setNumModules] = useState(5);
  const [lessonsPerModule, setLessonsPerModule] = useState(4);
  const [avgMinutes, setAvgMinutes] = useState(15);
  const [formats, setFormats] = useState<string[]>(['reading', 'exercise']);
  const [priorityTopics, setPriorityTopics] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');

  const totalLessons = numModules * lessonsPerModule;
  const totalHours = (totalLessons * avgMinutes) / 60;
  const suggestedPrice = useMemo(() => suggestPrice(numModules, lessonsPerModule, avgMinutes, level, courseType), [numModules, lessonsPerModule, avgMinutes, level, courseType]);

  function toggleFormat(f: string) {
    setFormats((curr) => curr.includes(f) ? (curr.length > 1 ? curr.filter((x) => x !== f) : curr) : [...curr, f]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { toast.error('Define o tópico do curso'); return; }
    if (formats.length === 0) { toast.error('Escolhe pelo menos um formato'); return; }
    setSubmitting(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { toast.error('Inicia sessão como admin'); setSubmitting(false); return; }

      const config = {
        topic: topic.trim(),
        level, num_modules: numModules, lessons_per_module: lessonsPerModule,
        avg_lesson_minutes: avgMinutes,
        tone, depth, formats, emoji, category, course_type: courseType, language,
        priority_topics: priorityTopics.split('\n').map((s) => s.trim()).filter(Boolean),
        extra_instructions: extraInstructions.trim() || undefined,
      };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-full-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Falha ao iniciar geração');
      toast.success('Geração iniciada! A acompanhar progresso...');
      router.push(`/admin/curso-ia/${data.job_id}` as any);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
      <div className="mt-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">✨ Gerar curso com IA</h1>
        <p className="text-sm text-slate-500 mt-1">Configura todos os parâmetros. O agente Claude gera estrutura e conteúdo completo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: Tópico e identidade */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">1. Tópico e identidade</h2>
          <div>
            <label className="label">Tópico do curso *</label>
            <textarea
              className="input min-h-[80px]"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Prompt engineering aplicado ao direito empresarial em Portugal. Foco em análise de contratos, jurisprudência e due diligence com Claude e GPT."
              required
            />
            <p className="text-xs text-slate-400 mt-1">Quanto mais específico, melhor o resultado.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_120px_120px] gap-4">
            <div>
              <label className="label">Idioma</label>
              <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <label className="label">Emoji</label>
              <select className="input text-xl" value={emoji} onChange={(e) => setEmoji(e.target.value)}>
                {EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tipo de curso</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COURSE_TYPES.map((t) => (
                <button key={t.v} type="button" onClick={() => setCourseType(t.v as any)} className={`text-left p-3 rounded-lg border transition-all ${courseType === t.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-medium text-sm text-slate-900">{t.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CARD 2: Estrutura modular */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">2. Estrutura modular</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Módulos</label>
              <input type="number" min="1" max="12" className="input text-center text-lg font-semibold" value={numModules} onChange={(e) => setNumModules(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))} />
            </div>
            <div>
              <label className="label">Aulas / módulo</label>
              <input type="number" min="1" max="10" className="input text-center text-lg font-semibold" value={lessonsPerModule} onChange={(e) => setLessonsPerModule(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} />
            </div>
            <div>
              <label className="label">Min / aula</label>
              <select className="input text-center text-lg font-semibold" value={avgMinutes} onChange={(e) => setAvgMinutes(parseInt(e.target.value))}>
                {[5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div><div className="font-semibold text-slate-900">{totalLessons}</div><div className="text-xs text-slate-500">aulas totais</div></div>
            <div><div className="font-semibold text-slate-900">{totalHours.toFixed(1)}h</div><div className="text-xs text-slate-500">duração total</div></div>
            <div><div className="font-semibold text-slate-900">{courseType === 'essential' ? 'Grátis' : `€${suggestedPrice}`}</div><div className="text-xs text-slate-500">preço sugerido</div></div>
          </div>
          {courseType === 'ai_generated' && (
            <p className="text-xs text-slate-500">💡 Sugestão de preço baseada em duração × nível. Podes ajustar depois no editor.</p>
          )}
        </section>

        {/* CARD 3: Nível e tom */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">3. Nível e tom</h2>
          <div>
            <label className="label">Nível do curso</label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button key={l.v} type="button" onClick={() => setLevel(l.v as any)} className={`p-3 rounded-lg border text-left transition-all ${level === l.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-medium text-sm text-slate-900">{l.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Tom de comunicação</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONES.map((t) => (
                <button key={t.v} type="button" onClick={() => setTone(t.v as any)} className={`p-3 rounded-lg border text-left transition-all ${tone === t.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-lg">{t.emoji}</div>
                  <div className="font-medium text-sm text-slate-900 mt-1">{t.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Profundidade do conteúdo</label>
            <div className="grid grid-cols-3 gap-2">
              {DEPTHS.map((d) => (
                <button key={d.v} type="button" onClick={() => setDepth(d.v as any)} className={`p-3 rounded-lg border text-left transition-all ${depth === d.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-medium text-sm text-slate-900">{d.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Formatos das aulas (mistura)</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button key={f.v} type="button" onClick={() => toggleFormat(f.v)} className={`p-3 rounded-lg border text-center transition-all ${formats.includes(f.v) ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-2xl">{f.emoji}</div>
                  <div className="font-medium text-sm text-slate-900 mt-1">{f.label}</div>
                  {formats.includes(f.v) && <div className="text-[10px] text-brand-600 font-bold mt-0.5">✓ INCLUÍDO</div>}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CARD 4: Calibração fina */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">4. Calibração fina (opcional)</h2>
          <div>
            <label className="label">Tópicos obrigatórios (1 por linha)</label>
            <textarea className="input min-h-[80px]" value={priorityTopics} onChange={(e) => setPriorityTopics(e.target.value)} placeholder="GDPR e dados pessoais&#10;Limitações do Claude vs GPT&#10;Casos de uso em Portugal" />
            <p className="text-xs text-slate-400 mt-1">O agente garante que cobre estes tópicos.</p>
          </div>
          <div>
            <label className="label">Instruções extra para o agente</label>
            <textarea className="input min-h-[60px]" value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)} placeholder="Ex: evita exemplos americanos, foca em PME portuguesas, inclui referências à legislação europeia" />
          </div>
        </section>

        {/* Submit */}
        <div className="sticky bottom-4 z-10">
          <button type="submit" disabled={submitting || !topic.trim()} className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold py-3.5 rounded-xl shadow-lg disabled:opacity-50 hover:shadow-xl transition-all">
            {submitting ? '⏳ A iniciar geração...' : `✨ Gerar curso de ${totalLessons} aulas (~${Math.ceil(totalLessons * 0.7)} min de geração)`}
          </button>
        </div>
      </form>
    </div>
  );
}

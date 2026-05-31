'use client';

import { useState } from 'react';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { toast } from 'sonner';

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  linkedin_url: string;
  website_url: string;
  github_url: string;
  preferred_lang: string;
  expertise: string[];
  years_experience: number | '';
  job_title: string;
  current_company: string;
  teaching_experience: string;
  proposed_course_title: string;
  proposed_course_description: string;
  proposed_course_format: string;
  proposed_course_language: string;
  proposed_target_audience: string;
  proposed_course_outline: string;
  proposed_course_duration: string;
  proposed_course_price_eur: number | '';
  demo_video_url: string;
  sample_lesson_url: string;
  portfolio_links: string;
  references_text: string;
}

const INITIAL: FormState = {
  full_name: '', email: '', phone: '', country: 'Portugal', city: '',
  linkedin_url: '', website_url: '', github_url: '',
  preferred_lang: 'pt',
  expertise: [], years_experience: '',
  job_title: '', current_company: '',
  teaching_experience: '',
  proposed_course_title: '', proposed_course_description: '',
  proposed_course_format: 'reading',
  proposed_course_language: 'pt',
  proposed_target_audience: '',
  proposed_course_outline: '',
  proposed_course_duration: '4-6h',
  proposed_course_price_eur: 49,
  demo_video_url: '', sample_lesson_url: '',
  portfolio_links: '', references_text: '',
};

const EXPERTISE_OPTIONS = [
  'IA generativa', 'LLMs e prompts', 'Computer Vision', 'NLP',
  'Machine Learning', 'Data Science', 'Automação no-code',
  'AI para negócio', 'AI para marketing', 'AI para vendas',
  'AI para produtividade', 'AI para finanças', 'Programação Python',
  'Ferramentas IA', 'Ética e regulação IA',
];

export function CandidaturaForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleExpertise(value: string) {
    setForm((f) => ({
      ...f,
      expertise: f.expertise.includes(value)
        ? f.expertise.filter((v) => v !== value)
        : f.expertise.length < 6 ? [...f.expertise, value] : f.expertise,
    }));
  }

  function canAdvance(): boolean {
    if (step === 1) return !!form.full_name && !!form.email && form.email.includes('@');
    if (step === 2) return form.expertise.length > 0 && !!form.job_title;
    if (step === 3) return !!form.proposed_course_title && !!form.proposed_course_description && form.proposed_course_description.length >= 50;
    return true;
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/instructor-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          application: {
            ...form,
            years_experience: form.years_experience || null,
            proposed_course_price_eur: form.proposed_course_price_eur || null,
          },
        }),
      });
      const data = await resp.json();
      if (!data.ok) {
        toast.error(data.error || 'Falha ao submeter');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      toast.success('Candidatura submetida com sucesso!');
    } catch (e: any) {
      toast.error(e.message || 'Erro de rede');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 sm:p-10 text-center animate-fade-in">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Candidatura recebida!</h2>
        <p className="text-slate-700 leading-relaxed mb-6">
          Acabámos de enviar um email de confirmação para <strong>{form.email}</strong>.<br />
          A nossa IA vai fazer uma análise inicial nas próximas horas e depois os admins revêem nos próximos 5-10 dias úteis.
        </p>
        <p className="text-sm text-slate-500">Boa sorte! 🤞</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Progress steps */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step ? 'bg-emerald-500 text-white' :
                s === step ? 'bg-brand-600 text-white scale-110' :
                'bg-slate-200 text-slate-500'
              }`}>{s < step ? '✓' : s}</div>
              {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${s < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        <div className="text-center mt-3 text-xs text-slate-500">
          {step === 1 && 'Passo 1 de 4 — Contacto'}
          {step === 2 && 'Passo 2 de 4 — Experiência'}
          {step === 3 && 'Passo 3 de 4 — Curso proposto'}
          {step === 4 && 'Passo 4 de 4 — Materiais e revisão'}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Sobre ti</h2>
            <p className="text-sm text-slate-500 mb-5">Como te contactamos.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome completo *</label>
                <input className="input" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="João Silva" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="joao@example.com" />
              </div>
              <div>
                <label className="label">Telefone (opcional)</label>
                <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+351 9..." />
              </div>
              <div>
                <label className="label">Idioma preferido</label>
                <select className="input" value={form.preferred_lang} onChange={(e) => update('preferred_lang', e.target.value)}>
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div>
                <label className="label">País</label>
                <input className="input" value={form.country} onChange={(e) => update('country', e.target.value)} />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Lisboa" />
              </div>
            </div>
            <div className="pt-2">
              <label className="label">LinkedIn (recomendado)</label>
              <input className="input" value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Website / portfólio</label>
                <input className="input" value={form.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="label">GitHub</label>
                <input className="input" value={form.github_url} onChange={(e) => update('github_url', e.target.value)} placeholder="https://github.com/..." />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">A tua experiência</h2>
            <p className="text-sm text-slate-500 mb-5">O que sabes fazer e há quanto tempo.</p>
            <div>
              <label className="label">Áreas de especialidade * <span className="text-xs text-slate-400">(até 6)</span></label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EXPERTISE_OPTIONS.map((exp) => (
                  <button key={exp} type="button" onClick={() => toggleExpertise(exp)}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      form.expertise.includes(exp)
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'
                    }`}>{exp}</button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Anos de experiência</label>
                <input type="number" min="0" max="50" className="input" value={form.years_experience} onChange={(e) => update('years_experience', e.target.value ? parseInt(e.target.value) : '')} />
              </div>
              <div>
                <label className="label">Função actual *</label>
                <input className="input" value={form.job_title} onChange={(e) => update('job_title', e.target.value)} placeholder="ML Engineer, Data Scientist..." />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Empresa actual</label>
                <input className="input" value={form.current_company} onChange={(e) => update('current_company', e.target.value)} placeholder="Onde trabalhas hoje" />
              </div>
            </div>
            <div>
              <label className="label">Experiência de ensino</label>
              <textarea className="input min-h-[100px]" value={form.teaching_experience} onChange={(e) => update('teaching_experience', e.target.value)}
                placeholder="Já ensinaste antes? Onde, a quem, sobre o quê. Pode ser informal (mentorias, workshops, escrita técnica)." />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">O curso que queres criar</h2>
            <p className="text-sm text-slate-500 mb-5">Mais detalhe aqui = melhor pontuação.</p>
            <div>
              <label className="label">Título proposto *</label>
              <input className="input" value={form.proposed_course_title} onChange={(e) => update('proposed_course_title', e.target.value)}
                placeholder="Ex: Automatização de relatórios com Claude e Python" />
            </div>
            <div>
              <label className="label">Descrição * <span className="text-xs text-slate-400">(min 50 caracteres)</span></label>
              <textarea className="input min-h-[120px]" value={form.proposed_course_description} onChange={(e) => update('proposed_course_description', e.target.value)}
                placeholder="Em 2-3 parágrafos: o que ensinas, para quem, e que problema concreto resolves." />
              <div className="text-xs text-slate-400 mt-1 tabular-nums">{form.proposed_course_description.length} / 50</div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Formato</label>
                <select className="input" value={form.proposed_course_format} onChange={(e) => update('proposed_course_format', e.target.value)}>
                  <option value="reading">Leitura</option>
                  <option value="video">Vídeo</option>
                  <option value="exercise">Exercícios</option>
                  <option value="mixed">Misto</option>
                </select>
              </div>
              <div>
                <label className="label">Idioma do curso</label>
                <select className="input" value={form.proposed_course_language} onChange={(e) => update('proposed_course_language', e.target.value)}>
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div>
                <label className="label">Duração estimada</label>
                <select className="input" value={form.proposed_course_duration} onChange={(e) => update('proposed_course_duration', e.target.value)}>
                  <option value="1-3h">1-3 horas</option>
                  <option value="4-6h">4-6 horas</option>
                  <option value="7-12h">7-12 horas</option>
                  <option value="13-25h">13-25 horas</option>
                  <option value="25h+">+25 horas</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Público-alvo</label>
              <input className="input" value={form.proposed_target_audience} onChange={(e) => update('proposed_target_audience', e.target.value)}
                placeholder="Ex: Programadores Python com 2+ anos a querer integrar LLMs no trabalho" />
            </div>
            <div>
              <label className="label">Estrutura proposta (módulos / aulas)</label>
              <textarea className="input min-h-[120px]" value={form.proposed_course_outline} onChange={(e) => update('proposed_course_outline', e.target.value)}
                placeholder="Lista os módulos e as aulas principais, mesmo que ainda não estejam fechados." />
            </div>
            <div>
              <label className="label">Preço sugerido (EUR)</label>
              <input type="number" min="0" max="500" className="input max-w-[200px]" value={form.proposed_course_price_eur} onChange={(e) => update('proposed_course_price_eur', e.target.value ? parseInt(e.target.value) : '')} />
              <p className="text-xs text-slate-500 mt-1">Receberás 50% de cada venda. Decisão final do preço acordada com a equipa.</p>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Materiais e revisão</h2>
            <p className="text-sm text-slate-500 mb-5">Quanto mais links concretos, melhor.</p>
            <div>
              <label className="label">Vídeo de apresentação (opcional)</label>
              <input className="input" value={form.demo_video_url} onChange={(e) => update('demo_video_url', e.target.value)} placeholder="https://youtube.com/..." />
              <p className="text-xs text-slate-500 mt-1">Vídeo curto (1-3 min) onde te apresentas e explicas o curso. Aumenta muito as hipóteses.</p>
            </div>
            <div>
              <label className="label">Amostra de aula (opcional)</label>
              <input className="input" value={form.sample_lesson_url} onChange={(e) => update('sample_lesson_url', e.target.value)} placeholder="https://..." />
              <p className="text-xs text-slate-500 mt-1">Link para uma aula tua já feita (vídeo, artigo, Notion, qualquer formato).</p>
            </div>
            <div>
              <label className="label">Portfólio adicional</label>
              <textarea className="input min-h-[80px]" value={form.portfolio_links} onChange={(e) => update('portfolio_links', e.target.value)}
                placeholder="Links separados por nova linha (Medium, GitHub, talks, livros, etc.)" />
            </div>
            <div>
              <label className="label">Referências</label>
              <textarea className="input min-h-[80px]" value={form.references_text} onChange={(e) => update('references_text', e.target.value)}
                placeholder="Pessoas, empresas ou comunidades que possam atestar a tua experiência." />
            </div>

            <div className="bg-slate-50 rounded-xl p-5 mt-6">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Resumo da candidatura</h3>
              <dl className="text-xs space-y-1.5 text-slate-600">
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">Nome:</dt><dd>{form.full_name}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">Email:</dt><dd>{form.email}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">Função:</dt><dd>{form.job_title}{form.current_company && ` · ${form.current_company}`}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">Especialidades:</dt><dd>{form.expertise.join(', ')}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">Curso:</dt><dd className="font-medium text-slate-700">{form.proposed_course_title}</dd></div>
              </dl>
            </div>
          </>
        )}
      </div>

      <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
        {step > 1 ? (
          <button onClick={() => setStep((step - 1) as 1 | 2 | 3)} className="text-sm text-slate-600 hover:text-slate-900 font-medium">← Anterior</button>
        ) : <div />}
        {step < 4 ? (
          <button onClick={() => setStep((step + 1) as 2 | 3 | 4)} disabled={!canAdvance()} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all">Continuar →</button>
        ) : (
          <button onClick={submit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all shadow">
            {submitting ? 'A submeter...' : '✓ Submeter candidatura'}
          </button>
        )}
      </div>
    </div>
  );
}

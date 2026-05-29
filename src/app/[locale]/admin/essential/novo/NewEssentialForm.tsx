'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';

const EMOJIS = ['📚','🤖','🧠','💡','📊','🎨','⚙️','🚀','📈','🔬','💬','🎯'];
const TYPES = [
  { v: 'essential', label: 'AI Essential', desc: 'Curso grátis, curado pela equipa, sempre actualizado' },
  { v: 'track', label: 'Track', desc: 'Percurso de aprendizagem (vários cursos)' },
  { v: 'ai_generated', label: 'AI-generated', desc: 'Curso pago, mas sem instrutor humano' },
];

export function NewEssentialForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState('essential');
  const [emoji, setEmoji] = useState('📚');
  const [level, setLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error('O título é obrigatório'); return; }
    setLoading(true);
    try {
      const r = await callAgentOps<{ course_id: string }>('admin_create_course', {
        title: title.trim(), subtitle, course_type: type, emoji, level, category: 'ai',
      });
      toast.success('Curso criado! A abrir o editor...');
      router.push(`/admin/curso/${r.course_id}/editar` as any);
    } catch (err: any) {
      toast.error(err.message === 'admin_required' ? 'Acesso restrito a administradores.' : err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <Link href={'/admin/cursos' as any} className="text-sm text-brand-600 hover:underline">← Cursos</Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-1">Criar curso AI Essential</h1>
      <p className="text-slate-500 text-sm mb-6">Curso curado pela equipa, sem instrutor humano. Conteúdo gerado e revisto.</p>

      <form onSubmit={handleCreate} className="space-y-5 bg-white rounded-xl border border-slate-200 p-6">
        <div>
          <label className="label">Tipo</label>
          <div className="space-y-2">
            {TYPES.map((t) => (
              <button key={t.v} type="button" onClick={() => setType(t.v)} className={`w-full text-left p-3 rounded-lg border transition-all ${type === t.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="font-medium text-slate-900">{t.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((em) => (
              <button key={em} type="button" onClick={() => setEmoji(em)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${emoji === em ? 'border-brand-500 bg-brand-50 scale-110' : 'border-slate-200 hover:border-slate-300'}`}>{em}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="title">Título *</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Fundamentos de Prompt Engineering" required />
        </div>
        <div>
          <label className="label" htmlFor="subtitle">Subtítulo</label>
          <input id="subtitle" className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="O que o aluno vai aprender em uma frase" />
        </div>
        <div>
          <label className="label" htmlFor="level">Nível</label>
          <select id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermédio</option>
            <option value="advanced">Avançado</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'A criar...' : 'Criar e abrir editor →'}
        </button>
      </form>
    </div>
  );
}

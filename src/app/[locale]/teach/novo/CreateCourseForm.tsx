'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';

const EMOJIS = ['📘','🤖','🧠','💡','📊','🎨','⚙️','🚀','📈','🔬','💬','🎯'];
const LEVELS = [['beginner','Iniciante'],['intermediate','Intermédio'],['advanced','Avançado']];

export function CreateCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📘');
  const [level, setLevel] = useState('beginner');
  const [price, setPrice] = useState('49');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error('O título é obrigatório'); return; }
    setLoading(true);
    try {
      const r = await callAgentOps<{ course_id: string }>('teach_create_course', {
        title: title.trim(), subtitle, description, emoji, level,
        price_cents: Math.round(parseFloat(price || '0') * 100),
      });
      toast.success('Curso criado! Agora adiciona o conteúdo.');
      router.push('/teach' as any);
      router.refresh();
    } catch (err: any) {
      const msg = err.message === 'no_instructor_record' ? 'Ainda não és instrutor aprovado.' :
                  err.message === 'instructor_not_approved' ? 'A tua conta de instrutor ainda não foi aprovada.' :
                  err.message === 'not_authenticated' ? 'Inicia sessão primeiro.' : err.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <Link href={'/teach' as any} className="text-sm text-brand-600 hover:underline">← Painel instrutor</Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-1">Criar novo curso</h1>
      <p className="text-slate-500 text-sm mb-6">Começa com o essencial. Podes adicionar módulos e aulas depois.</p>

      <form onSubmit={handleCreate} className="space-y-5 bg-white rounded-xl border border-slate-200 p-6">
        <div>
          <label className="label">Emoji do curso</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((em) => (
              <button key={em} type="button" onClick={() => setEmoji(em)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${emoji === em ? 'border-brand-500 bg-brand-50 scale-110' : 'border-slate-200 hover:border-slate-300'}`}>{em}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="title">Título *</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Domina o ChatGPT para Marketing" required />
        </div>
        <div>
          <label className="label" htmlFor="subtitle">Subtítulo</label>
          <input id="subtitle" className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Uma frase que resume o valor do curso" />
        </div>
        <div>
          <label className="label" htmlFor="desc">Descrição</label>
          <textarea id="desc" className="input min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreve o que os alunos vão aprender..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="level">Nível</label>
            <select id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="price">Preço (€)</label>
            <input id="price" type="number" min="0" step="1" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'A criar...' : 'Criar curso'}
        </button>
      </form>
    </div>
  );
}

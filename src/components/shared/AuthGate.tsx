'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function AuthGate({ open, onClose, onSuccess, title = 'Inicia sessão para continuar', description = 'Cria conta em 30 segundos ou entra com a tua conta existente. Não vais perder a tua progressão.' }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error('Email e password obrigatórios'); return; }
    setLoading(true);
    try {
      const sb = createClient();
      if (mode === 'register') {
        const { error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        toast.success('Conta criada! ✨');
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Bem-vindo de volta!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message === 'Invalid login credentials' ? 'Email ou password inválidos' : err.message || 'Erro');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-slate-700 text-2xl leading-none flex-shrink-0">×</button>
        </div>

        <div className="flex gap-1 mt-5 bg-slate-100 p-1 rounded-lg">
          <button type="button" onClick={() => setMode('register')} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Criar conta</button>
          <button type="button" onClick={() => setMode('login')} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Entrar</button>
        </div>

        <form onSubmit={submit} className="space-y-3 mt-5">
          {mode === 'register' && (
            <div>
              <label className="label">Nome</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria Silva" autoComplete="name" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'A processar...' : mode === 'register' ? 'Criar conta e continuar' : 'Entrar e continuar'}
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4 text-center">Ao continuar, concordas com os Termos e a Política de Privacidade.</p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error('A password tem de ter pelo menos 6 caracteres'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Conta criada! Verifica o email para confirmar.');
    router.push('/login' as any);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Nome</label>
        <input id="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" required autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'A criar...' : 'Criar conta grátis'}
      </button>
      <p className="text-xs text-slate-500 text-center">
        Ao criar conta, aceitas os nossos Termos e Política de Privacidade.
      </p>
    </form>
  );
}

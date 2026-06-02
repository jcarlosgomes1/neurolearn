'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function AuthGate({ open, onClose, onSuccess, title, description }: Props) {
  const t = useTranslations('auth_gate');
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error(t('required')); return; }
    setLoading(true);
    try {
      const sb = createClient();
      if (mode === 'register') {
        const { error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        toast.success(t('created'));
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t('welcome_back'));
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message === 'Invalid login credentials' ? t('invalid') : err.message || t('error'));
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{title || t('default_title')}</h2>
            <p className="text-sm text-slate-500 mt-1">{description || t('default_desc')}</p>
          </div>
          <button onClick={onClose} aria-label={t('close')} className="text-slate-400 hover:text-slate-700 text-2xl leading-none flex-shrink-0">×</button>
        </div>

        <div className="flex gap-1 mt-5 bg-slate-100 p-1 rounded-lg">
          <button type="button" onClick={() => setMode('register')} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('tab_register')}</button>
          <button type="button" onClick={() => setMode('login')} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('tab_login')}</button>
        </div>

        <form onSubmit={submit} className="space-y-3 mt-5">
          {mode === 'register' && (
            <div>
              <label className="label">{t('name')}</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name_ph')} autoComplete="name" />
            </div>
          )}
          <div>
            <label className="label">{t('email')}</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email_ph')} autoComplete="email" required />
          </div>
          <div>
            <label className="label">{t('password')}</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? t('processing') : mode === 'register' ? t('btn_register') : t('btn_login')}
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4 text-center">{t('legal')}</p>
      </div>
    </div>
  );
}

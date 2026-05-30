'use client';

import { Link } from '@/i18n/routing';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  email: string;
  area: 'student' | 'instructor' | 'admin';
}

const AREA_LABEL = {
  student: 'Aluno',
  instructor: 'Instrutor',
  admin: 'Admin',
};

const AREA_LINK = {
  student: '/learn',
  instructor: '/teach',
  admin: '/admin',
} as const;

export function UserMenu({ email, area }: Props) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const sb = createClient();
      // 1. SignOut local com scope global para limpar todos os tokens
      await sb.auth.signOut({ scope: 'global' });
    } catch (e) {
      console.error('signOut error:', e);
    }
    // 2. Apagar TODOS os cookies de Supabase manualmente (defensivo)
    try {
      document.cookie.split(';').forEach((c) => {
        const eq = c.indexOf('=');
        const name = (eq > -1 ? c.substr(0, eq) : c).trim();
        if (name.startsWith('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname}`;
        }
      });
    } catch {}
    // 3. Apagar localStorage Supabase (defensivo)
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.includes('supabase')) localStorage.removeItem(k);
      });
    } catch {}
    // 4. Forçar reload completo da página (não router.push) para o middleware SSR reler os cookies
    toast.success('Sessão terminada');
    window.location.href = '/';
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
          {email[0]?.toUpperCase() ?? '?'}
        </div>
        <span className="hidden sm:inline text-sm text-slate-700">{AREA_LABEL[area]}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-slate-200 py-1 animate-fade-in z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="text-xs text-slate-500">{AREA_LABEL[area]}</div>
            <div className="text-sm font-medium text-slate-900 truncate">{email}</div>
          </div>
          <Link href={AREA_LINK[area] as any} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
            📊 O meu painel
          </Link>
          <Link href={'/learn' as any} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
            📚 A minha aprendizagem
          </Link>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={signOut}
            disabled={signingOut}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {signingOut ? 'A terminar sessão...' : 'Sair'}
          </button>
        </div>
      )}
    </div>
  );
}

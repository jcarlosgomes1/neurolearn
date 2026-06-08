'use client';

import { Link } from '@/i18n/routing';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  email: string;
  area: 'student' | 'instructor' | 'admin';
}

function safeT(t: any, key: string, fb: string): string {
  try {
    const v = t(key);
    if (v && typeof v === 'string' && v !== key) return v;
  } catch {}
  return fb;
}

export function UserMenu({ email, area }: Props) {
  const t = useTranslations();
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

  const areaLabel = safeT(t, `user_menu.area.${area}`, area === 'admin' ? 'Admin' : area === 'instructor' ? 'Instrutor' : 'Aluno');
  const isHost = area === 'instructor' || area === 'admin';

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    // Independentemente de tudo, no fim redireciona — robusto
    try {
      const sb = createClient();
      await sb.auth.signOut({ scope: 'global' });
    } catch (e) {
      // silently ignore
    }
    try {
      document.cookie.split(';').forEach((c) => {
        const eq = c.indexOf('=');
        const name = (eq > -1 ? c.substr(0, eq) : c).trim();
        if (name.startsWith('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname}`;
        }
      });
    } catch {}
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.includes('supabase')) localStorage.removeItem(k);
      });
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.includes('supabase')) sessionStorage.removeItem(k);
      });
    } catch {}
    try { toast.success(safeT(t, 'user_menu.signed_out', 'Sessão terminada')); } catch {}
    // Hard reload garante limpeza total de estado
    window.location.replace('/');
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
        aria-label={safeT(t, 'user_menu.aria', 'Menu do utilizador')}
      >
        <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
          {email[0]?.toUpperCase() ?? '?'}
        </div>
        <span className="hidden sm:inline text-sm text-slate-700">{areaLabel}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 animate-fade-in z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="text-xs text-slate-500">{areaLabel}</div>
            <div className="text-sm font-medium text-slate-900 truncate">{email}</div>
          </div>

          {area === 'admin' && (
            <Link href={'/admin' as any} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
              🎛 {safeT(t, 'user_menu.admin_dashboard', 'Cockpit admin')}
            </Link>
          )}
          {area === 'instructor' && (
            <Link href={'/teach' as any} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
              📊 {safeT(t, 'user_menu.instructor_dashboard', 'Dashboard instrutor')}
            </Link>
          )}

          <Link href={'/conta' as any} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
            👤 {safeT(t, 'user_menu.account', 'A minha conta')}
          </Link>

          {isHost && (
            <Link href={'/conta/agendamento' as any} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
              📅 {safeT(t, 'user_menu.scheduling', 'Agendamento')}
            </Link>
          )}

          <Link href={'/learn' as any} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
            📚 {safeT(t, 'user_menu.learning', 'A minha aprendizagem')}
          </Link>

          <div className="border-t border-slate-100 my-1" />

          <button
            onClick={signOut}
            disabled={signingOut}
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium cursor-pointer"
          >
            {signingOut ? safeT(t, 'user_menu.signing_out', 'A terminar sessão...') : `🚪 ${safeT(t, 'user_menu.signout', 'Sair')}`}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { Link } from '@/i18n/routing';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

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

          {/* Logout via server endpoint — robusto, funciona mesmo se JS falhar */}
          <a
            href="/api/auth/logout"
            className="block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium cursor-pointer"
          >
            🚪 {safeT(t, 'user_menu.signout', 'Sair')}
          </a>
        </div>
      )}
    </div>
  );
}

'use client';

import { Link, useRouter, usePathname } from '@/i18n/routing';
import { useState, useEffect, useRef, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  email: string;
  area: 'student' | 'instructor' | 'admin';
}

const AREA_LINK = {
  student: '/learn',
  instructor: '/teach',
  admin: '/admin',
} as const;

const LANGS = [
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
] as const;

export function UserMenu({ email, area }: Props) {
  const t = useTranslations('user_menu');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function handleEnter() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHovering(true);
  }
  function handleLeave() {
    hoverTimeout.current = setTimeout(() => setHovering(false), 150);
  }

  function switchLang(newLocale: string) {
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
    setOpen(false);
    setHovering(false);
  }

  const isOpen = open || hovering;
  const areaLabel = t(`area.${area}` as any);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const sb = createClient();
      await sb.auth.signOut({ scope: 'global' });
    } catch (e) {
      console.error('signOut error:', e);
    }
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
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.includes('supabase')) localStorage.removeItem(k);
      });
    } catch {}
    toast.success(t('signed_out'));
    window.location.href = '/';
  }

  return (
    <div ref={ref} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
        aria-label={t('aria')}
      >
        <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
          {email[0]?.toUpperCase() ?? '?'}
        </div>
        <span className="hidden sm:inline text-sm text-slate-700">{areaLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 animate-fade-in z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="text-xs text-slate-500">{areaLabel}</div>
            <div className="text-sm font-medium text-slate-900 truncate">{email}</div>
          </div>

          <Link href={AREA_LINK[area] as any} className="block px-4 py-2 text-sm hover:bg-slate-50"
            onClick={() => { setOpen(false); setHovering(false); }}>
            {t('dashboard')}
          </Link>
          <Link href={'/learn' as any} className="block px-4 py-2 text-sm hover:bg-slate-50"
            onClick={() => { setOpen(false); setHovering(false); }}>
            {t('learning')}
          </Link>

          <div className="border-t border-slate-100 my-1" />

          <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            {tNav('language')}
          </div>
          <div className="px-3 pb-2 grid grid-cols-4 gap-1">
            {LANGS.map((l) => {
              const active = l.code === locale;
              return (
                <button
                  key={l.code}
                  onClick={() => switchLang(l.code)}
                  disabled={pending || active}
                  title={l.label}
                  className={
                    'flex flex-col items-center gap-0.5 py-1.5 rounded-md text-[10px] font-medium transition-colors ' +
                    (active
                      ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 cursor-default'
                      : 'hover:bg-slate-100 text-slate-600 disabled:opacity-50')
                  }
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span>{l.code.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 my-1" />

          <button
            onClick={signOut}
            disabled={signingOut}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {signingOut ? t('signing_out') : t('signout')}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Home, BookOpen, GraduationCap, Bell, User } from 'lucide-react';

function safeT(t: any, key: string, fb: string): string {
  try {
    const v = t(key);
    if (v && typeof v === 'string' && v !== key) return v;
  } catch {}
  return fb;
}

const ITEMS = [
  { href: '/', icon: Home, labelKey: 'nav.home', fb: 'Início' },
  { href: '/cursos', icon: BookOpen, labelKey: 'nav.courses', fb: 'Cursos' },
  { href: '/learn', icon: GraduationCap, labelKey: 'nav.learn', fb: 'Aprender' },
  { href: '/conta/notificacoes', icon: Bell, labelKey: 'nav.alerts', fb: 'Alertas', isBell: true },
  { href: '/conta', icon: User, labelKey: 'nav.account', fb: 'Conta' },
];

export function MobileBottomNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    const sb = createClient();
    async function load() {
      try {
        const { data } = await sb.rpc('nl_notifications_unseen_count');
        setUnread(typeof data === 'number' ? data : 0);
      } catch {}
    }
    load();
    const id = setInterval(load, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', load);
    window.addEventListener('nl:notifications-changed', load);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', load);
      window.removeEventListener('nl:notifications-changed', load);
    };
  }, [loggedIn]);

  // Comportamento estilo LinkedIn: esconde ao descer, reaparece (fixo) ao subir.
  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY.current;
        // ignora micro-movimentos (evita jitter); só reage a gestos claros
        if (Math.abs(dy) > 6) {
          // perto do topo: sempre visível
          if (y < 80) setHidden(false);
          else if (dy > 0) setHidden(true);   // a descer -> esconde
          else setHidden(false);              // a subir -> reaparece e fixa
          lastY.current = y;
        }
        ticking.current = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loggedIn, pathname]);

  const hide = !loggedIn || ['/admin', '/demo', '/login', '/register', '/onboarding', '/join'].some((p) => pathname?.startsWith(p));
  if (hide) return null;

  // Apenas o item mais especifico (href mais longo) fica ativo: evita que /conta
  // acenda quando estamos em /conta/notificacoes.
  const cur = pathname || '/';
  let bestHref = '';
  for (const it of ITEMS) {
    const m = it.href === '/' ? cur === '/' : (cur === it.href || cur.startsWith(it.href + '/'));
    if (m && it.href.length > bestHref.length) bestHref = it.href;
  }

  return (
    <>
      <div className="h-16 md:hidden" aria-hidden />
      <nav
        className={`fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-1px_12px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-out ${hidden ? 'translate-y-full' : 'translate-y-0'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 px-1">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const label = safeT(t, it.labelKey, it.fb);
            const active = it.href === bestHref;
            return (
              <Link key={it.href} href={it.href as any}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium relative ${active ? 'text-brand-700' : 'text-slate-500'}`}>
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
                  {it.isBell && unread > 0 && (
                    <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                {label}
                {active && <span className="absolute top-0 inset-x-3 h-0.5 bg-brand-600 rounded-b-full" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

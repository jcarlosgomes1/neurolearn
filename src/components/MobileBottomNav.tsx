'use client';

import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Home, BookOpen, GraduationCap, Bell, User } from 'lucide-react';

const ITEMS = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/cursos', icon: BookOpen, label: 'Cursos' },
  { href: '/learn', icon: GraduationCap, label: 'Learn' },
  { href: '/conta/notificacoes', icon: Bell, label: 'Alertas', isBell: true },
  { href: '/conta', icon: User, label: 'Conta' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [unread, setUnread] = useState(0);

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
        const { data } = await sb.rpc('nl_notifications_unread_summary');
        if (data?.ok) setUnread(data.count || 0);
      } catch {}
    }
    load();
    const id = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(id);
  }, [loggedIn]);

  // Hide on admin pages, demo, login, register
  const hide = !loggedIn || ['/admin', '/demo', '/login', '/register', '/onboarding', '/join'].some((p) => pathname?.startsWith(p));
  if (hide) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur border-t border-slate-200 pb-safe">
      <div className="grid grid-cols-5 px-1">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || (it.href !== '/' && pathname?.startsWith(it.href));
          return (
            <Link key={it.href} href={it.href as any}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium relative ${active ? 'text-brand-700' : 'text-slate-500'}`}>
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
                {it.isBell && unread > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              {it.label}
              {active && <span className="absolute top-0 inset-x-3 h-0.5 bg-brand-600 rounded-b-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

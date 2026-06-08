'use client';

import { Link, usePathname } from '@/i18n/routing';
import { User, Bell, Heart, Award, Sparkles, Shield, LogOut, BookOpen, Calendar, FileText, KeyRound, BellRing, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

function safeT(t: any, key: string, fb: string): string {
  try {
    const v = t(key);
    if (v && typeof v === 'string' && v !== key) return v;
  } catch {}
  return fb;
}

export function AccountSidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const GROUPS = [
    {
      items: [
        { href: '/conta', labelKey: 'account.item.profile', fb: 'Perfil', icon: User },
        { href: '/conta/aprendizagem', labelKey: 'account.item.learning', fb: 'A minha aprendizagem', icon: BookOpen },
        { href: '/conta/agendamento', labelKey: 'account.item.scheduling', fb: 'Agendamento', icon: Calendar },
      ],
    },
    {
      titleKey: 'account.group.notifications', titleFb: 'Notificações & alertas',
      items: [
        { href: '/conta/notificacoes', labelKey: 'account.item.inbox', fb: 'Inbox', icon: Bell },
        { href: '/conta/notificacoes/preferencias', labelKey: 'account.item.preferences', fb: 'Preferências', icon: BellRing },
      ],
    },
    {
      titleKey: 'account.group.personal', titleFb: 'Pessoal',
      items: [
        { href: '/conta/wishlist', labelKey: 'account.item.wishlist', fb: 'Lista de desejos', icon: Heart },
        { href: '/conta/talento', labelKey: 'account.item.talent', fb: 'Perfil talento', icon: Briefcase },
        { href: '/conta/afiliado', labelKey: 'account.item.affiliate', fb: 'Programa afiliado', icon: Award },
        { href: '/conta/candidato', labelKey: 'account.item.application', fb: 'Candidatura instrutor', icon: FileText },
      ],
    },
    {
      titleKey: 'account.group.account', titleFb: 'Conta',
      items: [
        { href: '/conta/subscription', labelKey: 'account.item.subscription', fb: 'Subscrição', icon: Sparkles },
        { href: '/conta/seguranca', labelKey: 'account.item.security', fb: 'Segurança & 2FA', icon: KeyRound },
        { href: '/conta/privacidade', labelKey: 'account.item.privacy', fb: 'Privacidade', icon: Shield },
      ],
    },
  ];

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const sb = createClient();
      await sb.auth.signOut({ scope: 'global' });
    } catch {}
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
    } catch {}
    try { toast.success(safeT(t, 'user_menu.signed_out', 'Sessão terminada')); } catch {}
    window.location.replace('/');
  }

  return (
    <aside className="w-full sm:w-60 flex-shrink-0">
      <nav className="bg-white border border-slate-200 rounded-xl p-2 space-y-0.5">
        {GROUPS.map((g, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-2 pt-2 border-t border-slate-100' : ''}>
            {g.titleKey && (
              <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">{safeT(t, g.titleKey, g.titleFb!)}</div>
            )}
            {g.items.map(({ href, labelKey, fb, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/conta' && pathname.startsWith(href));
              return (
                <Link key={href} href={href as any}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}>
                  <Icon className="h-4 w-4" /> {safeT(t, labelKey, fb)}
                </Link>
              );
            })}
          </div>
        ))}
        <button onClick={logout}
          disabled={busy}
          type="button"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 mt-2 border-t border-slate-100 pt-3 disabled:opacity-50 cursor-pointer">
          <LogOut className="h-4 w-4" /> {busy ? safeT(t, 'user_menu.signing_out', 'A terminar...') : safeT(t, 'account.signout', 'Terminar sessão')}
        </button>
      </nav>
    </aside>
  );
}

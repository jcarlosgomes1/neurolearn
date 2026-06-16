'use client';

import { Link, usePathname } from '@/i18n/routing';
import { User, Bell, Heart, Award, Sparkles, Shield, LogOut, BookOpen, Calendar, FileText, KeyRound, BellRing, Briefcase, GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

  const GROUPS = [
    {
      items: [
        { href: '/conta', labelKey: 'account.item.profile', fb: 'Perfil', icon: User },
        { href: '/conta/aprendizagem', labelKey: 'account.item.learning', fb: 'A minha aprendizagem', icon: BookOpen },
        { href: '/conta/certificados', labelKey: 'account.item.certificates', fb: 'Certificados', icon: GraduationCap },
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
        {/* Logout via server-side endpoint — garantido funciona, sem JS necessário */}
        <a href="/api/auth/logout"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 mt-2 border-t border-slate-100 pt-3 cursor-pointer">
          <LogOut className="h-4 w-4" /> {safeT(t, 'account.signout', 'Terminar sessão')}
        </a>
      </nav>
    </aside>
  );
}

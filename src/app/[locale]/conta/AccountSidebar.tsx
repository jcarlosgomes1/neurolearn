'use client';

import { Link, usePathname } from '@/i18n/routing';
import { User, Bell, Heart, Award, Sparkles, Shield, LogOut, BookOpen, Calendar, FileText, KeyRound, BellRing } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const GROUPS: Array<{ title?: string; items: Array<{ href: string; label: string; icon: any }> }> = [
  {
    items: [
      { href: '/conta', label: 'Perfil', icon: User },
      { href: '/conta/aprendizagem', label: 'A minha aprendizagem', icon: BookOpen },
      { href: '/conta/agendamento', label: 'Agendamento', icon: Calendar },
    ],
  },
  {
    title: 'Notificações & alertas',
    items: [
      { href: '/conta/notificacoes', label: 'Inbox', icon: Bell },
      { href: '/conta/notificacoes/preferencias', label: 'Preferências', icon: BellRing },
    ],
  },
  {
    title: 'Pessoal',
    items: [
      { href: '/conta/wishlist', label: 'Wishlist', icon: Heart },
      { href: '/conta/afiliado', label: 'Programa afiliado', icon: Award },
      { href: '/conta/candidato', label: 'Candidatura instrutor', icon: FileText },
    ],
  },
  {
    title: 'Conta',
    items: [
      { href: '/conta/subscription', label: 'Subscrição', icon: Sparkles },
      { href: '/conta/seguranca', label: 'Segurança & 2FA', icon: KeyRound },
      { href: '/conta/privacidade', label: 'Privacidade', icon: Shield },
    ],
  },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push('/' as any);
  }

  return (
    <aside className="w-full sm:w-60 flex-shrink-0">
      <nav className="bg-white border border-slate-200 rounded-xl p-2 space-y-0.5">
        {GROUPS.map((g, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-2 pt-2 border-t border-slate-100' : ''}>
            {g.title && (
              <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">{g.title}</div>
            )}
            {g.items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/conta' && pathname.startsWith(href));
              return (
                <Link key={href} href={href as any}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
          </div>
        ))}
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 mt-2 border-t border-slate-100 pt-3">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </nav>
    </aside>
  );
}

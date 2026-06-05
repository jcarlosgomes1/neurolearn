'use client';

import { Link, usePathname } from '@/i18n/routing';
import { User, Bell, Heart, Award, Sparkles, Shield, CreditCard, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const ITEMS = [
  { href: '/conta', label: 'Perfil', icon: User },
  { href: '/conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/conta/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/conta/afiliado', label: 'Afiliado', icon: Award },
  { href: '/conta/subscription', label: 'Subscrição', icon: Sparkles },
  { href: '/conta/privacidade', label: 'Privacidade', icon: Shield },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push('/');
  }

  return (
    <aside className="w-full sm:w-56 flex-shrink-0">
      <nav className="bg-white border border-slate-200 rounded-xl p-2 space-y-0.5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
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
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 mt-1 border-t border-slate-100 pt-3">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </nav>
    </aside>
  );
}

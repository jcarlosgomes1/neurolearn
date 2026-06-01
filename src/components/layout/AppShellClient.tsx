'use client';

import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Session { email: string; area: 'student' | 'instructor' | 'admin' }
interface Props {
  role: 'admin' | 'instructor' | 'student';
  pageTitle?: string;
  session: Session | null;
  children: React.ReactNode;
}

interface NavItem { href: string; label: string; emoji: string; group?: string }

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Cockpit', emoji: '🎛', group: 'Overview' },
  { href: '/admin/eventos', label: 'Eventos', emoji: '📡', group: 'Overview' },
  { href: '/admin/cursos', label: 'Cursos', emoji: '📚', group: 'Conteúdo' },
  { href: '/admin/marketing', label: 'Marketing', emoji: '📢', group: 'Conteúdo' },
  { href: '/admin/candidaturas', label: 'Candidaturas', emoji: '🎓', group: 'Pessoas' },
  { href: '/admin/instrutores', label: 'Instrutores', emoji: '👨‍🏫', group: 'Pessoas' },
  { href: '/admin/instrutores-ai', label: 'AI por instrutor', emoji: '🧠', group: 'Pessoas' },
  { href: '/admin/payments', label: 'Payments', emoji: '💳', group: 'Operações' },
  { href: '/admin/video', label: 'Vídeo (Mux)', emoji: '🎥', group: 'Operações' },
  { href: '/admin/jobs', label: 'Jobs', emoji: '⚙️', group: 'Operações' },
  { href: '/admin/tutor-config', label: 'Tutor config', emoji: '🤖', group: 'Operações' },
];

const INSTRUCTOR_NAV: NavItem[] = [
  { href: '/teach', label: 'Dashboard', emoji: '📊', group: 'Visão geral' },
  { href: '/teach/novo', label: 'Criar curso', emoji: '✨', group: 'Conteúdo' },
  { href: '/teach?tab=courses', label: 'Os meus cursos', emoji: '📚', group: 'Conteúdo' },
  { href: '/teach?tab=students', label: 'Estudantes', emoji: '👥', group: 'Comunidade' },
  { href: '/teach?tab=reviews', label: 'Avaliações', emoji: '⭐', group: 'Comunidade' },
  { href: '/teach?tab=payouts', label: 'Pagamentos', emoji: '💰', group: 'Operações' },
];

const STUDENT_NAV: NavItem[] = [
  { href: '/learn', label: 'A minha aprendizagem', emoji: '📚', group: 'Aprender' },
  { href: '/cursos', label: 'Explorar cursos', emoji: '🔍', group: 'Aprender' },
  { href: '/search', label: 'Pesquisar', emoji: '🔎', group: 'Aprender' },
  { href: '/learn?tab=certificates', label: 'Certificados', emoji: '🏆', group: 'Resultados' },
  { href: '/learn?tab=notes', label: 'Notas', emoji: '📝', group: 'Resultados' },
];

const ROLE_META: Record<string, { label: string; badge: string }> = {
  admin: { label: 'Admin', badge: 'bg-rose-100 text-rose-700' },
  instructor: { label: 'Instrutor', badge: 'bg-amber-100 text-amber-700' },
  student: { label: 'Aluno', badge: 'bg-emerald-100 text-emerald-700' },
};

export function AppShellClient({ role, pageTitle, session, children }: Props) {
  const t = useTranslations();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const nav = role === 'admin' ? ADMIN_NAV : role === 'instructor' ? INSTRUCTOR_NAV : STUDENT_NAV;
  const meta = ROLE_META[role];

  // Group nav items
  const groups = nav.reduce((acc, item) => {
    const g = item.group || 'Outros';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  function isActive(href: string): boolean {
    const cleanHref = href.split('?')[0];
    if (cleanHref === '/admin' || cleanHref === '/teach' || cleanHref === '/learn') {
      return pathname === cleanHref || pathname.endsWith(cleanHref);
    }
    return pathname.includes(cleanHref);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOPBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-3 sm:px-4 gap-2">
        {/* Hamburger mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={t('nav.open_menu')}
          className="lg:hidden w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">🧠</span>
          <span className="hidden sm:inline text-base tracking-tight">NeuroLearn</span>
        </Link>

        {/* Role badge */}
        <span className={`hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badge}`}>
          {meta.label}
        </span>

        {/* Page title (desktop) */}
        {pageTitle && <span className="hidden md:inline text-sm text-slate-400 ml-2">/ {pageTitle}</span>}

        <div className="flex-1" />

        {/* Right actions */}
        <Link href={'/search' as any} aria-label={t('nav.search')} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        </Link>
        <LanguageSwitcher />
        {session && <UserMenu email={session.email} area={session.area} />}
      </header>

      <div className="flex">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex w-60 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-slate-200 bg-white flex-col overflow-y-auto">
          <SidebarContent groups={groups} isActive={isActive} />
        </aside>

        {/* SIDEBAR MOBILE DRAWER */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <aside className="absolute top-0 left-0 bottom-0 w-72 max-w-[85%] bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  <span className="font-bold text-slate-900">NeuroLearn</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
                </button>
              </div>
              <SidebarContent groups={groups} isActive={isActive} />
            </aside>
          </div>
        )}

        {/* CONTENT */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ groups, isActive }: { groups: Record<string, NavItem[]>; isActive: (href: string) => boolean }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-5">
      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName}>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">{groupName}</h3>
          <div className="space-y-0.5">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

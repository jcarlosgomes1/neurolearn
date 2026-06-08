'use client';

import { Link } from '@/i18n/routing';
import { UserMenu } from './UserMenu';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Session { email: string; area: 'student' | 'instructor' | 'admin' }
interface Props { role: 'admin' | 'instructor' | 'student'; pageTitle?: string; session: Session | null; children: React.ReactNode; }
interface NavItem { href: string; labelKey?: string; label?: string; emoji: string; groupKey: string; badge?: string }

// Resolve label de forma defensiva — nunca lança MISSING_MESSAGE
function tryT(t: any, item: NavItem): string {
  if (item.label) return item.label;
  if (item.labelKey) {
    try {
      const v = t(item.labelKey);
      if (v && typeof v === 'string' && v !== item.labelKey) return v;
    } catch {}
  }
  return item.href.split('/').filter(Boolean).pop() || item.href;
}

function safeT(t: any, key: string, fallback: string): string {
  try {
    const v = t(key);
    if (v && typeof v === 'string' && v !== key) return v;
  } catch {}
  return fallback;
}

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/overview', label: 'Visão geral', emoji: '🎯', groupKey: 'overview' },
  { href: '/admin', label: 'Cockpit', emoji: '🎛', groupKey: 'overview' },
  { href: '/admin/sistema', label: 'Sistema', emoji: '💚', groupKey: 'overview' },
  { href: '/admin/eventos', label: 'Eventos', emoji: '📡', groupKey: 'overview' },
  { href: '/admin/agentes', label: 'Agentes', emoji: '🤝', groupKey: 'overview' },

  { href: '/admin/cursos', label: 'Cursos', emoji: '📚', groupKey: 'content' },
  { href: '/admin/learning-paths', label: 'Percursos', emoji: '🛤', groupKey: 'content' },
  { href: '/admin/preview', label: 'Pré-visualizar', emoji: '👀', groupKey: 'content' },
  { href: '/admin/cms', label: 'CMS Home', emoji: '📝', groupKey: 'content' },
  { href: '/admin/cms-pages', label: 'Páginas CMS', emoji: '📄', groupKey: 'content', badge: 'Novo' },
  { href: '/admin/marketing', label: 'Marketing', emoji: '📢', groupKey: 'content' },
  { href: '/admin/social', label: 'Social', emoji: '📣', groupKey: 'content' },

  { href: '/admin/empresas', label: 'Empresas', emoji: '🏢', groupKey: 'people' },
  { href: '/admin/candidaturas', label: 'Candidaturas', emoji: '🎓', groupKey: 'people' },
  { href: '/admin/instrutores', label: 'Instrutores', emoji: '👨‍🏫', groupKey: 'people' },
  { href: '/admin/instrutores-ai', label: 'IA features', emoji: '🧠', groupKey: 'people' },
  { href: '/admin/ai-routing', label: 'AI routing', emoji: '🎚', groupKey: 'people' },

  { href: '/admin/billing', label: 'Billing', emoji: '💰', groupKey: 'operations' },
  { href: '/admin/payments', label: 'Pagamentos', emoji: '💳', groupKey: 'operations' },
  { href: '/admin/video', label: 'Vídeo', emoji: '🎥', groupKey: 'operations' },
  { href: '/admin/autopilots', label: 'Autopilots', emoji: '🤖', groupKey: 'operations' },
  { href: '/admin/jobs', label: 'Jobs', emoji: '⚙️', groupKey: 'operations' },
  { href: '/admin/erros', label: 'Erros', emoji: '🐞', groupKey: 'operations' },
  { href: '/admin/tutor-config', label: 'Tutor IA', emoji: '💡', groupKey: 'operations' },
  { href: '/admin/prompts', label: 'Prompts', emoji: '💬', groupKey: 'operations' },
  { href: '/admin/integracoes', label: 'Integrações', emoji: '🔌', groupKey: 'operations' },
  { href: '/admin/audit-logs', label: 'Audit logs', emoji: '🔎', groupKey: 'operations' },
  { href: '/admin/api-keys', label: 'API keys', emoji: '🔑', groupKey: 'operations' },

  { href: '/admin/sso', label: 'SSO / SAML', emoji: '🛡', groupKey: 'system' },
  { href: '/admin/scim', label: 'SCIM tokens', emoji: '🆔', groupKey: 'system' },
  { href: '/admin/email-templates', label: 'Templates email', emoji: '✉️', groupKey: 'system' },
  { href: '/admin/drip-schedules', label: 'Drip schedules', emoji: '⏳', groupKey: 'system' },
  { href: '/admin/nav-items', label: 'Menus & Footer', emoji: '🧭', groupKey: 'system', badge: 'Novo' },
  { href: '/admin/platform-config', label: 'Config plataforma', emoji: '⚙️', groupKey: 'system', badge: 'Novo' },
];

const INSTRUCTOR_NAV: NavItem[] = [
  { href: '/teach', label: 'Dashboard', emoji: '📊', groupKey: 'overview' },
  { href: '/teach/avaliacoes-pendentes', label: 'Avaliações por validar', emoji: '✅', groupKey: 'overview', badge: 'Novo' },
  { href: '/teach/novo', label: 'Criar curso', emoji: '✨', groupKey: 'content' },
  { href: '/teach/servicos', label: 'Serviços corporativos', emoji: '🤝', groupKey: 'content' },
  { href: '/teach/pedidos', label: 'Pedidos B2B', emoji: '📥', groupKey: 'community' },
  { href: '/conta/agendamento', label: 'Agendamento', emoji: '📅', groupKey: 'operations' },
];

const STUDENT_NAV: NavItem[] = [
  { href: '/learn', label: 'A minha aprendizagem', emoji: '📚', groupKey: 'learn' },
  { href: '/aprender/percursos', label: 'Percursos', emoji: '🛤', groupKey: 'learn' },
  { href: '/cursos', label: 'Explorar catálogo', emoji: '🔍', groupKey: 'learn' },
  { href: '/search', label: 'Pesquisar', emoji: '🔎', groupKey: 'learn' },
  { href: '/talento', label: 'Marketplace talento', emoji: '💼', groupKey: 'results' },
];

const GROUP_LABELS: Record<string, string> = {
  overview: 'Visão geral',
  content: 'Conteúdo',
  people: 'Pessoas',
  operations: 'Operações',
  system: 'Sistema',
  community: 'Comunidade',
  learn: 'Aprender',
  results: 'Resultados',
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
  const roleBadge = role === 'admin' ? 'bg-rose-100 text-rose-700' : role === 'instructor' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
  const roleLabel = safeT(t, `shell.role.${role}`, role === 'admin' ? 'Admin' : role === 'instructor' ? 'Instrutor' : 'Aluno');

  const groups = useMemo(() => {
    const acc: Record<string, { groupKey: string; items: NavItem[] }> = {};
    for (const item of nav) {
      if (!acc[item.groupKey]) acc[item.groupKey] = { groupKey: item.groupKey, items: [] };
      acc[item.groupKey].items.push(item);
    }
    return Object.values(acc);
  }, [nav]);

  function isActive(href: string): boolean {
    const cleanHref = href.split('?')[0];
    if (cleanHref === '/admin' || cleanHref === '/teach' || cleanHref === '/learn') {
      return pathname === cleanHref || pathname.endsWith(cleanHref);
    }
    return pathname.includes(cleanHref);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-3 sm:px-4 gap-2">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={safeT(t, 'nav.open_menu', 'Abrir menu')}
          className="lg:hidden w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors active:scale-95">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">🧠</span>
          <span className="hidden sm:inline text-base tracking-tight">NeuroLearn</span>
        </Link>
        <span className={`hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleBadge}`}>{roleLabel}</span>
        {pageTitle && <span className="hidden md:inline text-sm text-slate-400 ml-2">/ {pageTitle}</span>}
        <div className="flex-1" />
        <Link href={'/search' as any} aria-label={safeT(t, 'nav.search', 'Pesquisar')} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        </Link>
        {session && <UserMenu email={session.email} area={session.area} />}
      </header>
      <div className="flex">
        <aside className="hidden lg:flex w-60 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-slate-200 bg-white flex-col overflow-y-auto">
          <SidebarContent groups={groups} isActive={isActive} t={t} />
        </aside>
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <aside className="absolute top-0 left-0 bottom-0 w-72 max-w-[85%] bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  <span className="font-bold text-slate-900">NeuroLearn</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${roleBadge}`}>{roleLabel}</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
                </button>
              </div>
              <SidebarContent groups={groups} isActive={isActive} t={t} />
            </aside>
          </div>
        )}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ groups, isActive, t }: { groups: { groupKey: string; items: NavItem[] }[]; isActive: (href: string) => boolean; t: any }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-5">
      {groups.map((group) => (
        <div key={group.groupKey}>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">{GROUP_LABELS[group.groupKey] || group.groupKey}</h3>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const label = tryT(t, item);
              return (
                <Link key={item.href} href={item.href as any}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <span className="text-base flex-shrink-0">{item.emoji}</span>
                  <span className="truncate flex-1">{label}</span>
                  {item.badge && (
                    <span className="text-[9px] bg-fuchsia-100 text-fuchsia-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

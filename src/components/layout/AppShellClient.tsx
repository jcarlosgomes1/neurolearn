'use client';

import { Link } from '@/i18n/routing';
import { UserMenu } from './UserMenu';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Session { email: string; area: 'student' | 'instructor' | 'admin' }
interface Props { role: 'admin' | 'instructor' | 'student'; pageTitle?: string; session: Session | null; children: React.ReactNode; }
interface NavItem { href: string; labelKey?: string; label?: string; emoji: string; groupKey: string; badge?: string }

function tryT(t: (k: string) => string, item: NavItem): string {
  if (item.label) return item.label;
  if (item.labelKey) {
    try {
      const v = t(item.labelKey as any);
      if (v && v !== item.labelKey) return v;
    } catch {}
  }
  return item.href.split('/').pop() || item.href;
}

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/overview', label: 'Visão geral', emoji: '🎯', groupKey: 'shell.group.overview' },
  { href: '/admin', labelKey: 'shell.admin.cockpit', emoji: '🎛', groupKey: 'shell.group.overview' },
  { href: '/admin/sistema', labelKey: 'shell.admin.system', emoji: '💚', groupKey: 'shell.group.overview' },
  { href: '/admin/eventos', labelKey: 'shell.admin.events', emoji: '📡', groupKey: 'shell.group.overview' },
  { href: '/admin/agentes', labelKey: 'shell.admin.agentes', emoji: '🤝', groupKey: 'shell.group.overview' },

  { href: '/admin/cursos', labelKey: 'shell.admin.courses', emoji: '📚', groupKey: 'shell.group.content' },
  { href: '/admin/learning-paths', label: 'Percursos', emoji: '🛤', groupKey: 'shell.group.content' },
  { href: '/admin/preview', labelKey: 'shell.admin.preview', emoji: '👀', groupKey: 'shell.group.content' },
  { href: '/admin/cms', labelKey: 'shell.admin.cms', emoji: '📝', groupKey: 'shell.group.content' },
  { href: '/admin/cms-pages', label: 'Páginas CMS', emoji: '📄', groupKey: 'shell.group.content', badge: 'Novo' },
  { href: '/admin/marketing', labelKey: 'shell.admin.marketing', emoji: '📢', groupKey: 'shell.group.content' },
  { href: '/admin/marketing/calendario', labelKey: 'shell.admin.marketing_calendar', emoji: '📅', groupKey: 'shell.group.content' },
  { href: '/admin/social', labelKey: 'shell.admin.social', emoji: '📣', groupKey: 'shell.group.content' },

  { href: '/admin/empresas', labelKey: 'shell.admin.companies', emoji: '🏢', groupKey: 'shell.group.people' },
  { href: '/admin/candidaturas', labelKey: 'shell.admin.applications', emoji: '🎓', groupKey: 'shell.group.people' },
  { href: '/admin/instrutores', labelKey: 'shell.admin.instructors', emoji: '👨‍🏫', groupKey: 'shell.group.people' },
  { href: '/admin/instrutores-ai', labelKey: 'shell.admin.ai_features', emoji: '🧠', groupKey: 'shell.group.people' },
  { href: '/admin/ai-routing', labelKey: 'shell.admin.ai_routing', emoji: '🎚', groupKey: 'shell.group.people' },

  { href: '/admin/billing', labelKey: 'shell.admin.billing', emoji: '💰', groupKey: 'shell.group.operations' },
  { href: '/admin/payments', labelKey: 'shell.admin.payments', emoji: '💳', groupKey: 'shell.group.operations' },
  { href: '/admin/video', labelKey: 'shell.admin.video', emoji: '🎥', groupKey: 'shell.group.operations' },
  { href: '/admin/autopilots', labelKey: 'shell.admin.autopilots', emoji: '🤖', groupKey: 'shell.group.operations' },
  { href: '/admin/jobs', labelKey: 'shell.admin.jobs', emoji: '⚙️', groupKey: 'shell.group.operations' },
  { href: '/admin/erros', labelKey: 'shell.admin.errors', emoji: '🐞', groupKey: 'shell.group.operations' },
  { href: '/admin/tutor-config', labelKey: 'shell.admin.tutor_config', emoji: '💡', groupKey: 'shell.group.operations' },
  { href: '/admin/prompts', labelKey: 'shell.admin.prompts', emoji: '💬', groupKey: 'shell.group.operations' },
  { href: '/admin/integracoes', labelKey: 'shell.admin.integrations', emoji: '🔌', groupKey: 'shell.group.operations' },
  { href: '/admin/audit-logs', label: 'Audit logs', emoji: '🔎', groupKey: 'shell.group.operations' },
  { href: '/admin/api-keys', label: 'API keys', emoji: '🔑', groupKey: 'shell.group.operations' },

  { href: '/admin/sso', label: 'SSO / SAML', emoji: '🛡', groupKey: 'shell.group.system' },
  { href: '/admin/scim', label: 'SCIM tokens', emoji: '🆔', groupKey: 'shell.group.system' },
  { href: '/admin/email-templates', label: 'Templates email', emoji: '✉️', groupKey: 'shell.group.system' },
  { href: '/admin/drip-schedules', label: 'Drip schedules', emoji: '⏳', groupKey: 'shell.group.system' },
  { href: '/admin/nav-items', label: 'Menus & Footer', emoji: '🧭', groupKey: 'shell.group.system', badge: 'Novo' },
  { href: '/admin/platform-config', label: 'Config plataforma', emoji: '⚙️', groupKey: 'shell.group.system', badge: 'Novo' },
];

const INSTRUCTOR_NAV: NavItem[] = [
  { href: '/teach', labelKey: 'shell.instructor.dashboard', emoji: '📊', groupKey: 'shell.group.overview' },
  { href: '/teach/avaliacoes-pendentes', label: 'Avaliações por validar', emoji: '✅', groupKey: 'shell.group.overview', badge: 'Novo' },
  { href: '/teach/novo', labelKey: 'shell.instructor.create', emoji: '✨', groupKey: 'shell.group.content' },
  { href: '/teach?tab=courses', labelKey: 'shell.instructor.my_courses', emoji: '📚', groupKey: 'shell.group.content' },
  { href: '/teach/servicos', label: 'Serviços corporativos', emoji: '🤝', groupKey: 'shell.group.content' },
  { href: '/teach/pedidos', label: 'Pedidos B2B', emoji: '📥', groupKey: 'shell.group.community' },
  { href: '/teach?tab=students', labelKey: 'shell.instructor.students', emoji: '👥', groupKey: 'shell.group.community' },
  { href: '/teach?tab=reviews', labelKey: 'shell.instructor.reviews', emoji: '⭐', groupKey: 'shell.group.community' },
  { href: '/teach?tab=payouts', labelKey: 'shell.instructor.payouts', emoji: '💰', groupKey: 'shell.group.operations' },
  { href: '/conta/agendamento', label: 'Agendamento', emoji: '📅', groupKey: 'shell.group.operations' },
];

const STUDENT_NAV: NavItem[] = [
  { href: '/learn', labelKey: 'shell.student.learning', emoji: '📚', groupKey: 'shell.group.learn' },
  { href: '/aprender/percursos', label: 'Percursos', emoji: '🛤', groupKey: 'shell.group.learn' },
  { href: '/cursos', labelKey: 'shell.student.explore', emoji: '🔍', groupKey: 'shell.group.learn' },
  { href: '/search', labelKey: 'shell.student.search', emoji: '🔎', groupKey: 'shell.group.learn' },
  { href: '/talento', label: 'Marketplace talento', emoji: '💼', groupKey: 'shell.group.results' },
  { href: '/learn?tab=certificates', labelKey: 'shell.student.certificates', emoji: '🏆', groupKey: 'shell.group.results' },
  { href: '/learn?tab=notes', labelKey: 'shell.student.notes', emoji: '📝', groupKey: 'shell.group.results' },
];

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
  const roleLabel = (() => { try { return t(`shell.role.${role}` as any); } catch { return role; } })();

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

  function groupLabel(groupKey: string): string {
    try {
      const v = t(groupKey as any);
      if (v && v !== groupKey) return v;
    } catch {}
    // Fallbacks
    const fb: Record<string, string> = {
      'shell.group.overview': 'Visão geral',
      'shell.group.content': 'Conteúdo',
      'shell.group.people': 'Pessoas',
      'shell.group.operations': 'Operações',
      'shell.group.system': 'Sistema',
      'shell.group.community': 'Comunidade',
      'shell.group.learn': 'Aprender',
      'shell.group.results': 'Resultados',
    };
    return fb[groupKey] || groupKey;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-3 sm:px-4 gap-2">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={(() => { try { return t('nav.open_menu' as any); } catch { return 'Menu'; } })()}
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
        <Link href={'/search' as any} aria-label={(() => { try { return t('nav.search' as any); } catch { return 'Pesquisar'; } })()} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        </Link>
        {session && <UserMenu email={session.email} area={session.area} />}
      </header>
      <div className="flex">
        <aside className="hidden lg:flex w-60 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-slate-200 bg-white flex-col overflow-y-auto">
          <SidebarContent groups={groups} isActive={isActive} t={t} groupLabel={groupLabel} />
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
              <SidebarContent groups={groups} isActive={isActive} t={t} groupLabel={groupLabel} />
            </aside>
          </div>
        )}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ groups, isActive, t, groupLabel }: { groups: { groupKey: string; items: NavItem[] }[]; isActive: (href: string) => boolean; t: (k: string) => string; groupLabel: (k: string) => string }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-5">
      {groups.map((group) => (
        <div key={group.groupKey}>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">{groupLabel(group.groupKey)}</h3>
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

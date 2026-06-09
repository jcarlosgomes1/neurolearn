'use client';

import { Link } from '@/i18n/routing';
import { UserMenu } from './UserMenu';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Session { email: string; area: 'student' | 'instructor' | 'admin' }
interface Props { role: 'admin' | 'instructor' | 'student'; pageTitle?: string; session: Session | null; children: React.ReactNode; }
interface NavItem { href: string; labelKey: string; emoji: string; groupKey: string; badge?: string }

function safeT(t: any, key: string, fb: string): string {
  try {
    const v = t(key);
    if (v && typeof v === 'string' && v !== key) return v;
  } catch {}
  return fb;
}

const ADMIN_NAV: NavItem[] = [
  // Visão geral
  { href: '/admin/overview', labelKey: 'shell.admin.overview', emoji: '🎯', groupKey: 'shell.group.overview' },
  { href: '/admin/eventos', labelKey: 'shell.admin.events', emoji: '📡', groupKey: 'shell.group.overview' },

  // Conteúdo
  { href: '/admin/cursos', labelKey: 'shell.admin.courses', emoji: '📚', groupKey: 'shell.group.content' },
  { href: '/admin/learning-paths', labelKey: 'shell.admin.learning_paths', emoji: '🛤', groupKey: 'shell.group.content' },
  { href: '/admin/preview', labelKey: 'shell.admin.preview', emoji: '👀', groupKey: 'shell.group.content' },
  { href: '/admin/cms', labelKey: 'shell.admin.cms', emoji: '📝', groupKey: 'shell.group.content' },
  { href: '/admin/cms-pages', labelKey: 'shell.admin.cms_pages', emoji: '📄', groupKey: 'shell.group.content' },

  // Marketing
  { href: '/admin/marketing', labelKey: 'shell.admin.marketing', emoji: '📢', groupKey: 'shell.group.marketing' },
  { href: '/admin/social', labelKey: 'shell.admin.social', emoji: '📣', groupKey: 'shell.group.marketing' },
  { href: '/admin/email-templates', labelKey: 'shell.admin.email_templates', emoji: '✉️', groupKey: 'shell.group.marketing' },
  { href: '/admin/drip-schedules', labelKey: 'shell.admin.drip_schedules', emoji: '⏳', groupKey: 'shell.group.marketing' },

  // Pessoas & Empresas
  { href: '/admin/empresas', labelKey: 'shell.admin.companies', emoji: '🏢', groupKey: 'shell.group.people' },
  { href: '/admin/candidaturas', labelKey: 'shell.admin.applications', emoji: '🎓', groupKey: 'shell.group.people' },
  { href: '/admin/instrutores', labelKey: 'shell.admin.instructors', emoji: '👨‍🏫', groupKey: 'shell.group.people' },

  // Receita
  { href: '/admin/billing', labelKey: 'shell.admin.billing', emoji: '💰', groupKey: 'shell.group.revenue' },
  { href: '/admin/payments', labelKey: 'shell.admin.payments', emoji: '💳', groupKey: 'shell.group.revenue' },

  // IA & Automação
  { href: '/admin/instrutores-ai', labelKey: 'shell.admin.smart_features', emoji: '🧠', groupKey: 'shell.group.ai' },
  { href: '/admin/ai-routing', labelKey: 'shell.admin.smart_routing', emoji: '🎚', groupKey: 'shell.group.ai' },
  { href: '/admin/tutor-config', labelKey: 'shell.admin.tutor_config', emoji: '💡', groupKey: 'shell.group.ai' },
  { href: '/admin/prompts', labelKey: 'shell.admin.prompts', emoji: '💬', groupKey: 'shell.group.ai' },
  { href: '/admin/autopilots', labelKey: 'shell.admin.autopilots', emoji: '🤖', groupKey: 'shell.group.ai' },
  { href: '/admin/video', labelKey: 'shell.admin.video', emoji: '🎥', groupKey: 'shell.group.ai' },

  // Observabilidade
  { href: '/admin/sistema', labelKey: 'shell.admin.system', emoji: '💚', groupKey: 'shell.group.observability' },
  { href: '/admin/agentes', labelKey: 'shell.admin.agentes', emoji: '🤝', groupKey: 'shell.group.observability' },
  { href: '/admin/jobs', labelKey: 'shell.admin.jobs', emoji: '⚙️', groupKey: 'shell.group.observability' },
  { href: '/admin/erros', labelKey: 'shell.admin.errors', emoji: '🐞', groupKey: 'shell.group.observability' },
  { href: '/admin/audit-logs', labelKey: 'shell.admin.audit_logs', emoji: '🔎', groupKey: 'shell.group.observability' },

  // Sistema & Segurança
  { href: '/admin/sso', labelKey: 'shell.admin.sso', emoji: '🛡', groupKey: 'shell.group.system' },
  { href: '/admin/scim', labelKey: 'shell.admin.scim', emoji: '🆔', groupKey: 'shell.group.system' },
  { href: '/admin/integracoes', labelKey: 'shell.admin.integrations', emoji: '🔌', groupKey: 'shell.group.system' },
  { href: '/admin/api-keys', labelKey: 'shell.admin.api_keys', emoji: '🔑', groupKey: 'shell.group.system' },
  { href: '/admin/nav-items', labelKey: 'shell.admin.nav_items', emoji: '🧭', groupKey: 'shell.group.system' },
  { href: '/admin/platform-config', labelKey: 'shell.admin.platform_config', emoji: '⚙️', groupKey: 'shell.group.system' },
  { href: '/admin/i18n', labelKey: 'shell.admin.i18n', emoji: '🌐', groupKey: 'shell.group.system' },
];

const INSTRUCTOR_NAV: NavItem[] = [
  { href: '/teach', labelKey: 'shell.instructor.dashboard', emoji: '📊', groupKey: 'shell.group.overview' },
  { href: '/teach/avaliacoes-pendentes', labelKey: 'shell.instructor.evaluations_pending', emoji: '✅', groupKey: 'shell.group.overview', badge: 'Novo' },
  { href: '/teach/novo', labelKey: 'shell.instructor.create', emoji: '✨', groupKey: 'shell.group.content' },
  { href: '/teach/servicos', labelKey: 'shell.instructor.services', emoji: '🤝', groupKey: 'shell.group.content' },
  { href: '/teach/pedidos', labelKey: 'shell.instructor.requests', emoji: '📥', groupKey: 'shell.group.community' },
  { href: '/conta/agendamento', labelKey: 'shell.instructor.scheduling', emoji: '📅', groupKey: 'shell.group.operations' },
];

const STUDENT_NAV: NavItem[] = [
  { href: '/learn', labelKey: 'shell.student.learning', emoji: '📚', groupKey: 'shell.group.learn' },
  { href: '/aprender/percursos', labelKey: 'shell.student.learning_paths', emoji: '🛤', groupKey: 'shell.group.learn' },
  { href: '/cursos', labelKey: 'shell.student.explore', emoji: '🔍', groupKey: 'shell.group.learn' },
  { href: '/search', labelKey: 'shell.student.search', emoji: '🔎', groupKey: 'shell.group.learn' },
  { href: '/talento', labelKey: 'shell.student.talent', emoji: '💼', groupKey: 'shell.group.results' },
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
  const roleLabel = safeT(t, `shell.role.${role}`, role);

  const groups = useMemo(() => {
    const acc: Record<string, { groupKey: string; items: NavItem[] }> = {};
    for (const item of nav) {
      if (!acc[item.groupKey]) acc[item.groupKey] = { groupKey: item.groupKey, items: [] };
      acc[item.groupKey].items.push(item);
    }
    return Object.values(acc);
  }, [nav]);

  // Normalize pathname (strip leading locale segment) for precise active matching
  const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  function isActive(href: string): boolean {
    const clean = href.split('?')[0];
    if (clean === '/admin' || clean === '/teach' || clean === '/learn') {
      return cleanPath === clean;
    }
    return cleanPath === clean || cleanPath.startsWith(clean + '/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-3 sm:px-4 gap-2">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={safeT(t, 'nav.open_menu', 'Open menu')}
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
        <Link href={'/search' as any} aria-label={safeT(t, 'nav.search', 'Search')} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
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
  // Group that contains the active route (open by default)
  let activeKey = groups[0]?.groupKey;
  for (const g of groups) {
    if (g.items.some((i) => isActive(i.href))) { activeKey = g.groupKey; break; }
  }

  const [open, setOpen] = useState<string[]>(() => (activeKey ? [activeKey] : []));

  useEffect(() => {
    if (activeKey) setOpen((prev) => (prev.includes(activeKey!) ? prev : [...prev, activeKey!]));
  }, [activeKey]);

  function toggle(k: string) {
    setOpen((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {groups.map((group) => {
        const isOpen = open.includes(group.groupKey);
        const label = safeT(t, group.groupKey, group.groupKey.split('.').pop() || '');
        const hasActive = group.items.some((i) => isActive(i.href));
        return (
          <div key={group.groupKey}>
            <button
              onClick={() => toggle(group.groupKey)}
              aria-expanded={isOpen}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${hasActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <svg className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              <span className="flex-1 text-left truncate">{label}</span>
              {!isOpen && hasActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />}
            </button>
            {isOpen && (
              <div className="mt-0.5 ml-[1.1rem] pl-2 border-l border-slate-100 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const ilabel = safeT(t, item.labelKey, item.labelKey.split('.').pop() || item.href);
                  return (
                    <Link key={item.href} href={item.href as any}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <span className="text-base flex-shrink-0">{item.emoji}</span>
                      <span className="truncate flex-1">{ilabel}</span>
                      {item.badge && (
                        <span className="text-[9px] bg-fuchsia-100 text-fuchsia-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0">{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

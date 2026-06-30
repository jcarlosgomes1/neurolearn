'use client';

import { Link, useRouter } from '@/i18n/routing';
import { UserMenu } from './UserMenu';
import { PageGlyphProvider } from './PageGlyph';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ListTodo, Wrench, Radio, HeartPulse, BookOpen, Library, Route, Search, Package, ListChecks, FlaskConical, Award, Trophy, Gamepad2, Video, Mic, ShieldCheck, Star, Eye, Users, GraduationCap, FileCheck, Building2, BadgeEuro, ScrollText, FileText, TrendingUp, DollarSign, CreditCard, Receipt, Undo2, Coins, Ticket, ArrowUpCircle, PlusCircle, Link2, LineChart, Filter, BarChart3, Gem, Megaphone, Share2, CalendarDays, Mail, Hourglass, Inbox, LayoutTemplate, Files, PanelTop, Compass, SearchCheck, Cpu, SlidersHorizontal, MessageSquare, Sparkles, Lightbulb, Bot, Plane, Brain, Banknote, Clock, Workflow, Bug, FileSearch, Activity, ClipboardCheck, Server, Plug, Fingerprint, Shield, KeyRound, Settings2, Globe, ToggleLeft, Palette, Briefcase, Handshake, FolderTree, Zap } from 'lucide-react';

interface Session { email: string; area: 'student' | 'instructor' | 'admin'; areas: Array<'student' | 'instructor' | 'admin'> }
interface NavItem { href: string; labelKey: string; emoji: string; groupKey: string; badge?: string }
interface Props { role: 'admin' | 'instructor' | 'student'; pageTitle?: string; session: Session | null; nav: NavItem[]; collapsedPref?: boolean | null; pageGlyph?: string; glyphMap?: { route: string; emoji: string }[]; children: React.ReactNode; }

const FREQUENT: Record<string, string[]> = {
  admin: ['/admin/overview', '/admin/tools', '/admin/cursos', '/admin/users', '/admin/payments', '/admin/i18n', '/admin/backlog', '/admin/ai-custos'],
};

function safeT(t: any, key: string, fb: string): string {
  try {
    const v = t(key);
    if (v && typeof v === 'string' && v !== key) return v;
  } catch {}
  return fb;
}

function keyTail(k: string | null | undefined): string {
  return (typeof k === 'string' ? k : '').split('.').pop() || '';
}

function scoreMatch(term: string, label: string, href: string): number {
  if (!term) return 1;
  if (label.startsWith(term)) return 100;
  if (label.split(/\s+/).some((w) => w.startsWith(term))) return 80;
  if (label.includes(term)) return 60;
  if (href.includes(term)) return 40;
  let i = 0;
  for (let c = 0; c < label.length && i < term.length; c++) { if (label[c] === term[i]) i++; }
  return i === term.length ? 20 : 0;
}

function SearchTrigger({ onClick, t }: { onClick: () => void; t: any }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-white hover:border-slate-300 transition-colors text-sm">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
      <span className="flex-1 text-left">{safeT(t, 'shell.search.placeholder', 'Pesquisar…')}</span>
      <kbd className="hidden lg:inline text-[10px] font-sans font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">⌘K</kbd>
    </button>
  );
}

function CommandPalette({ open, onClose, items, t }: { open: boolean; onClose: () => void; items: NavItem[]; t: any }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQ(''); setHi(0); const id = setTimeout(() => { if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) inputRef.current?.focus(); }, 30); return () => clearTimeout(id); }
  }, [open]);

  const results = useMemo(() => {
    const labelled = items.map((it) => ({ it, label: safeT(t, it.labelKey || it.href || '', keyTail(it.labelKey) || it.href || ''), group: safeT(t, it.groupKey || '', '') }));
    const term = q.trim().toLowerCase();
    if (!term) return labelled.slice(0, 60);
    return labelled
      .map((x) => ({ ...x, score: scoreMatch(term, x.label.toLowerCase(), x.it.href.toLowerCase()) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);
  }, [q, items, t]);

  useEffect(() => { setHi(0); }, [q]);

  if (!open || typeof document === 'undefined') return null;

  function go(href: string) { onClose(); router.push(href as any); }

  return createPortal((
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 pt-[14vh] animate-in fade-in duration-150" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 border-b border-slate-100">
          <svg className="text-slate-400 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); const r = results[hi]; if (r) go(r.it.href); }
              else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }}
            placeholder={safeT(t, 'shell.search.placeholder', 'Pesquisar…')}
            className="flex-1 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent" />
          <button onClick={onClose} className="text-[10px] font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hover:bg-slate-50">ESC</button>
        </div>
        <div className="max-h-[52vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">{safeT(t, 'shell.search.empty', 'Sem resultados')}</div>
          ) : results.map((r, i) => (
            <button key={r.it.href} onMouseEnter={() => setHi(i)} onClick={() => go(r.it.href)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${i === hi ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              <NavIcon name={r.it.emoji} className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="flex-1 truncate font-medium">{r.label}</span>
              {r.group && <span className="text-[11px] text-slate-400 flex-shrink-0">{r.group}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  ), document.body);
}

export function AppShellClient({ role, pageTitle, session, nav, collapsedPref, pageGlyph, glyphMap, children }: Props) {
  const t = useTranslations();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();

  const isLessonRoute = /\/learn\/curso\/[^/]+\/aula(\/|$)/.test(pathname);
  const [collapsed, setCollapsed] = useState<boolean>(collapsedPref ?? isLessonRoute);
  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try { document.cookie = `nl_sb=${next ? '1' : '0'};path=/;max-age=31536000;samesite=lax`; } catch {}
      return next;
    });
  }

  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openPalette = () => { setSidebarOpen(false); setPaletteOpen(true); };

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

  const allGroups = useMemo(() => {
    const wanted = FREQUENT[role] || [];
    const items = wanted.map((h) => nav.find((n) => n.href === h)).filter(Boolean) as NavItem[];
    return items.length ? [{ groupKey: 'shell.group.frequent', items }, ...groups] : groups;
  }, [nav, role, groups]);

  const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  const resolvedGlyph = useMemo(() => {
    const p = cleanPath.replace(/^\/empresa\/[^/]+/, '/empresa');
    let best = ''; let bestLen = -1;
    for (const g of (glyphMap || [])) {
      const r = g?.route || '';
      if (r && (p === r || p.startsWith(r + '/')) && r.length > bestLen) { best = g.emoji || ''; bestLen = r.length; }
    }
    return best || pageGlyph || '';
  }, [cleanPath, glyphMap, pageGlyph]);

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
          <span className="hidden sm:inline text-base tracking-tight">{t('brand.name')}</span>
        </Link>
        <span className={`hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleBadge}`}>{roleLabel}</span>
        {pageTitle && <span className="hidden md:inline text-sm text-slate-400 ml-2">/ {pageTitle}</span>}
        <div className="flex-1" />
        <button onClick={openPalette} aria-label={safeT(t, 'shell.search.placeholder', 'Pesquisar…')} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        {session && <UserMenu email={session.email} area={session.area} areas={session.areas} currentRole={role} />}
      </header>
      <div className="flex">
        {!isLessonRoute && (collapsed ? (
          <aside className="hidden lg:flex w-16 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-slate-200 bg-white flex-col items-center py-3 gap-1 overflow-y-auto">
            <button onClick={toggleCollapsed} title={safeT(t, 'shell.expand', 'Expandir menu')} aria-label={safeT(t, 'shell.expand', 'Expandir menu')}
              className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <button onClick={openPalette} title={safeT(t, 'shell.search.placeholder', 'Pesquisar…')} aria-label={safeT(t, 'shell.search.placeholder', 'Pesquisar…')}
              className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <div className="w-8 h-px bg-slate-100 my-1.5" />
            {nav.map((item) => {
              const active = isActive(item.href);
              const ilabel = safeT(t, item.labelKey || item.href || '', keyTail(item.labelKey) || item.href || '');
              return (
                <Link key={item.href} href={item.href as any} title={ilabel} aria-label={ilabel}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}>
                  <NavIcon name={item.emoji} className="h-5 w-5" />
                </Link>
              );
            })}
          </aside>
        ) : (
          <aside className="hidden lg:flex w-60 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-slate-200 bg-white flex-col overflow-y-auto">
            <div className="px-3 pt-4 pb-1 flex items-center gap-1.5">
              <div className="flex-1 min-w-0"><SearchTrigger onClick={openPalette} t={t} /></div>
              <button onClick={toggleCollapsed} title={safeT(t, 'shell.collapse', 'Colapsar menu')} aria-label={safeT(t, 'shell.collapse', 'Colapsar menu')}
                className="w-9 h-9 flex-shrink-0 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            </div>
            <SidebarContent groups={allGroups} isActive={isActive} t={t} />
          </aside>
        ))}
        {sidebarOpen && typeof document !== 'undefined' && createPortal((
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <aside className="absolute top-0 left-0 bottom-0 w-72 max-w-[85%] bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  <span className="font-bold text-slate-900">{t('brand.name')}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${roleBadge}`}>{roleLabel}</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
                </button>
              </div>
              <div className="px-3 pt-3 pb-1"><SearchTrigger onClick={openPalette} t={t} /></div>
              <SidebarContent groups={allGroups} isActive={isActive} t={t} />
            </aside>
          </div>
        ), document.body)}
        <main className="flex-1 min-w-0 overflow-x-hidden"><div className={`mx-auto w-full max-w-6xl ${role === 'admin' || isLessonRoute ? '' : 'px-4 sm:px-6 lg:px-8'} ${role === 'admin' || isLessonRoute ? 'pt-3 pb-6 sm:py-8' : 'pt-4 pb-12 sm:py-10'}`}><PageGlyphProvider value={resolvedGlyph}>{children}</PageGlyphProvider></div></main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={nav} t={t} />
    </div>
  );
}

const NAV_ICONS: Record<string, any> = {
  'layout-dashboard': LayoutDashboard, 'list-todo': ListTodo, 'wrench': Wrench, 'radio': Radio, 'heart-pulse': HeartPulse,
  'book-open': BookOpen, 'library': Library, 'route': Route, 'search': Search, 'package': Package, 'list-checks': ListChecks, 'flask-conical': FlaskConical, 'award': Award, 'trophy': Trophy, 'gamepad-2': Gamepad2, 'video': Video, 'mic': Mic, 'shield-check': ShieldCheck, 'star': Star, 'eye': Eye,
  'users': Users, 'graduation-cap': GraduationCap, 'file-check': FileCheck, 'building-2': Building2, 'badge-euro': BadgeEuro, 'scroll-text': ScrollText, 'file-text': FileText,
  'trending-up': TrendingUp, 'dollar-sign': DollarSign, 'credit-card': CreditCard, 'receipt': Receipt, 'undo-2': Undo2, 'coins': Coins, 'ticket': Ticket, 'arrow-up-circle': ArrowUpCircle, 'plus-circle': PlusCircle, 'link-2': Link2, 'line-chart': LineChart, 'filter': Filter, 'bar-chart-3': BarChart3, 'gem': Gem,
  'megaphone': Megaphone, 'share-2': Share2, 'calendar-days': CalendarDays, 'mail': Mail, 'hourglass': Hourglass, 'inbox': Inbox, 'layout-template': LayoutTemplate, 'files': Files, 'panel-top': PanelTop, 'compass': Compass, 'search-check': SearchCheck,
  'cpu': Cpu, 'sliders-horizontal': SlidersHorizontal, 'message-square': MessageSquare, 'sparkles': Sparkles, 'lightbulb': Lightbulb, 'bot': Bot, 'plane': Plane, 'brain': Brain, 'banknote': Banknote, 'clock': Clock, 'workflow': Workflow, 'bug': Bug, 'file-search': FileSearch, 'activity': Activity, 'clipboard-check': ClipboardCheck, 'server': Server, 'plug': Plug, 'fingerprint': Fingerprint, 'shield': Shield, 'key-round': KeyRound, 'settings-2': Settings2, 'globe': Globe, 'toggle-left': ToggleLeft, 'palette': Palette, 'briefcase': Briefcase, 'handshake': Handshake, 'folder-tree': FolderTree, 'zap': Zap,
};

function NavIcon({ name, className }: { name?: string; className?: string }) {
  const Cmp = name ? NAV_ICONS[name] : null;
  if (Cmp) {
    return <Cmp className={className} strokeWidth={1.75} style={{ filter: 'drop-shadow(0 1px 0.5px rgba(255,255,255,0.75)) drop-shadow(0 -1px 0.5px rgba(2,6,23,0.16))' }} />;
  }
  return <span className={`inline-flex items-center justify-center ${className || ''}`} style={{ fontSize: '1.05rem', lineHeight: 1 }}>{name}</span>;
}

function SidebarContent({ groups, isActive, t }: { groups: { groupKey: string; items: NavItem[] }[]; isActive: (href: string) => boolean; t: any }) {
  const FREQUENT_KEY = 'shell.group.frequent';
  const nonFreq = groups.filter((g) => g.groupKey !== FREQUENT_KEY);
  let activeKey = nonFreq[0]?.groupKey;
  for (const g of nonFreq) {
    if (g.items.some((i) => isActive(i.href))) { activeKey = g.groupKey; break; }
  }

  const hasFreq = groups.some((g) => g.groupKey === FREQUENT_KEY);
  const [open, setOpen] = useState<string[]>(() => {
    const init: string[] = activeKey ? [activeKey] : [];
    if (hasFreq) init.push(FREQUENT_KEY);
    return init;
  });

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
        const label = safeT(t, group.groupKey || '', keyTail(group.groupKey));
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
                  const ilabel = safeT(t, item.labelKey || item.href || '', keyTail(item.labelKey) || item.href || '');
                  return (
                    <Link key={item.href} href={item.href as any}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <NavIcon name={item.emoji} className="h-[18px] w-[18px] flex-shrink-0" />
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

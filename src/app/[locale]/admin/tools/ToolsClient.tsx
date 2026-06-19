'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Search, LayoutDashboard, ListTodo, Wrench, Radio, HeartPulse, BookOpen, Library, Route, Package, ListChecks, FlaskConical, Award, Trophy, Gamepad2, Video, Mic, ShieldCheck, Star, Eye, Users, GraduationCap, FileCheck, Building2, BadgeEuro, ScrollText, FileText, TrendingUp, DollarSign, CreditCard, Receipt, Undo2, Coins, Ticket, ArrowUpCircle, PlusCircle, Link2, LineChart, Filter, BarChart3, Gem, Megaphone, Share2, CalendarDays, Mail, Hourglass, Inbox, LayoutTemplate, Files, PanelTop, Compass, SearchCheck, Cpu, SlidersHorizontal, MessageSquare, Sparkles, Lightbulb, Bot, Plane, Brain, Banknote, Clock, Workflow, Bug, FileSearch, Activity, ClipboardCheck, Server, Plug, Fingerprint, Shield, KeyRound, Settings2, Globe, ToggleLeft, Palette, Briefcase, Handshake, FolderTree, Zap } from 'lucide-react';

interface Item { href: string; i18n_key: string | null; icon: string | null; group_key: string | null }
type Row = Item & { label: string; group: string };

const NAV_ICONS: Record<string, any> = {
  'layout-dashboard': LayoutDashboard, 'list-todo': ListTodo, 'wrench': Wrench, 'radio': Radio, 'heart-pulse': HeartPulse,
  'book-open': BookOpen, 'library': Library, 'route': Route, 'search': Search, 'package': Package, 'list-checks': ListChecks, 'flask-conical': FlaskConical, 'award': Award, 'trophy': Trophy, 'gamepad-2': Gamepad2, 'video': Video, 'mic': Mic, 'shield-check': ShieldCheck, 'star': Star, 'eye': Eye,
  'users': Users, 'graduation-cap': GraduationCap, 'file-check': FileCheck, 'building-2': Building2, 'badge-euro': BadgeEuro, 'scroll-text': ScrollText, 'file-text': FileText,
  'trending-up': TrendingUp, 'dollar-sign': DollarSign, 'credit-card': CreditCard, 'receipt': Receipt, 'undo-2': Undo2, 'coins': Coins, 'ticket': Ticket, 'arrow-up-circle': ArrowUpCircle, 'plus-circle': PlusCircle, 'link-2': Link2, 'line-chart': LineChart, 'filter': Filter, 'bar-chart-3': BarChart3, 'gem': Gem,
  'megaphone': Megaphone, 'share-2': Share2, 'calendar-days': CalendarDays, 'mail': Mail, 'hourglass': Hourglass, 'inbox': Inbox, 'layout-template': LayoutTemplate, 'files': Files, 'panel-top': PanelTop, 'compass': Compass, 'search-check': SearchCheck,
  'cpu': Cpu, 'sliders-horizontal': SlidersHorizontal, 'message-square': MessageSquare, 'sparkles': Sparkles, 'lightbulb': Lightbulb, 'bot': Bot, 'plane': Plane, 'brain': Brain, 'banknote': Banknote, 'clock': Clock, 'workflow': Workflow, 'bug': Bug, 'file-search': FileSearch, 'activity': Activity, 'clipboard-check': ClipboardCheck, 'server': Server, 'plug': Plug, 'fingerprint': Fingerprint, 'shield': Shield, 'key-round': KeyRound, 'settings-2': Settings2, 'globe': Globe, 'toggle-left': ToggleLeft, 'palette': Palette, 'briefcase': Briefcase, 'handshake': Handshake, 'folder-tree': FolderTree, 'zap': Zap,
};

function ToolIcon({ name, className }: { name?: string | null; className?: string }) {
  const Cmp = name ? NAV_ICONS[name] : null;
  if (Cmp) return <Cmp className={className} strokeWidth={1.9} />;
  return <Compass className={className} />;
}

export function ToolsClient({ items }: { items: Item[] }) {
  const t = useTranslations() as any;
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function safeT(key: string | null, fb: string): string {
    if (!key) return fb;
    try { const v = t(key); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  // No mobile, nao focar automaticamente (evita abrir o teclado). Desktop mantem foco.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      inputRef.current?.focus();
    }
  }, []);

  const rows: Row[] = useMemo(
    () => items.map((it) => ({
      ...it,
      label: safeT(it.i18n_key, (it.href.split('/').filter(Boolean).pop() || it.href)),
      group: safeT(it.group_key, safeT('shell.group.more', 'Outros')),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );

  const term = q.trim().toLowerCase();
  const filtered = term
    ? rows.filter((x) => x.label.toLowerCase().includes(term) || x.group.toLowerCase().includes(term) || x.href.toLowerCase().includes(term))
    : rows;

  const groups = useMemo(() => {
    const m: Record<string, Row[]> = {};
    for (const it of filtered) { if (!m[it.group]) m[it.group] = []; m[it.group].push(it); }
    return Object.entries(m);
  }, [filtered]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative mb-6 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={safeT('admin.tools.search_placeholder', 'Pesquisar ferramentas…')}
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
        />
      </div>

      {groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-sm text-slate-400">{safeT('admin.tools.empty', 'Sem resultados.')}</p>
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map(([group, list]) => (
            <div key={group}>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">{group} <span className="text-slate-300">· {list.length}</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {list.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href as any}
                    className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <ToolIcon name={it.icon} className="h-[18px] w-[18px] flex-shrink-0 text-slate-500 group-hover:text-violet-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-violet-700 truncate">{it.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

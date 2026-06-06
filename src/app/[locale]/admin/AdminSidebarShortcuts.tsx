'use client';

import { Link } from '@/i18n/routing';
import {
  Package, Tag, DollarSign, GraduationCap, Shield, Key, BarChart3, Receipt,
  RotateCcw, Mail, Users, Lock, Sparkles, CalendarClock, AlertTriangle, Settings
} from 'lucide-react';

type ShortcutItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type ShortcutSection = {
  title: string;
  accent: string;
  items: ShortcutItem[];
};

const SECTIONS: ShortcutSection[] = [
  {
    title: 'Receita',
    accent: 'text-emerald-600',
    items: [
      { href: '/admin/revenue', label: 'Revenue', icon: BarChart3 },
      { href: '/admin/monetizacao', label: 'Monetização', icon: DollarSign },
      { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
      { href: '/admin/refunds', label: 'Refunds', icon: RotateCcw },
      { href: '/admin/upsells', label: 'Upsell signals', icon: Sparkles },
    ],
  },
  {
    title: 'Catálogo',
    accent: 'text-violet-600',
    items: [
      { href: '/admin/bundles', label: 'Bundles', icon: Package },
      { href: '/admin/learning-paths', label: 'Percursos', icon: GraduationCap },
      { href: '/admin/addons', label: 'Add-ons', icon: Package },
      { href: '/admin/cupoes', label: 'Cupões', icon: Tag },
      { href: '/admin/drip-schedules', label: 'Calendário drip', icon: CalendarClock, badge: 'Novo' },
    ],
  },
  {
    title: 'Empresa',
    accent: 'text-blue-600',
    items: [
      { href: '/admin/sso', label: 'SSO', icon: Lock },
      { href: '/admin/scim', label: 'SCIM tokens', icon: Users },
      { href: '/admin/email-templates', label: 'Email templates', icon: Mail },
    ],
  },
  {
    title: 'Operações',
    accent: 'text-amber-600',
    items: [
      { href: '/admin/audit-logs', label: 'Audit logs', icon: Shield },
      { href: '/admin/api-keys', label: 'API Keys', icon: Key },
      { href: '/admin/erros', label: 'Erros', icon: AlertTriangle },
      { href: '/admin/sistema', label: 'Sistema', icon: Settings },
    ],
  },
];

// Shortcuts para áreas admin — usado no AppShell
export function AdminSidebarShortcuts() {
  return (
    <div className="space-y-0.5">
      {/* Overview destacado no topo */}
      <Link
        href={'/admin/overview' as any}
        className="group flex items-center gap-2 px-3 py-2.5 mb-2 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100 border border-violet-200/60 hover:border-violet-300 transition-all">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-[1.05] transition-transform">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900">Visão geral</div>
          <div className="text-[11px] text-slate-500 leading-tight">Dashboard executivo</div>
        </div>
      </Link>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-3 pt-3 pb-1">
            {section.title}
          </div>
          {section.items.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href as any}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-sm transition-colors">
              <Icon className={`h-4 w-4 ${section.accent} opacity-80 group-hover:opacity-100`} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[9px] font-semibold uppercase tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

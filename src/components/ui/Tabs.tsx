'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Link, usePathname } from '@/i18n/routing';

export interface TabItem {
  k: string;
  label: string;
  icon?: LucideIcon;
  count?: number | null;
}

/**
 * Barra de separadores canónica. Uma só implementação para todos os hubs — chrome idêntico.
 */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: readonly TabItem[];
  value: string;
  onChange: (k: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-slate-200 mb-5 flex gap-1 overflow-x-auto scrollbar-none', className)}>
      {items.map((tb) => {
        const Icon = tb.icon;
        const active = value === tb.k;
        return (
          <button
            key={tb.k}
            type="button"
            onClick={() => onChange(tb.k)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              active
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200',
            )}
          >
            {Icon && <Icon className="h-4 w-4" />} {tb.label}
            {typeof tb.count === 'number' && tb.count > 0 && (
              <span
                className={cn(
                  'ml-1 text-xs px-1.5 py-0.5 rounded-full tabular-nums',
                  active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600',
                )}
              >
                {tb.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface TabNavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  count?: number | null;
}

/** Barra de separadores por ROTA (Link + ativo por pathname). Mesmo chrome do Tabs. */
export function TabsNav({ items, className }: { items: readonly TabNavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <div className={cn('border-b border-slate-200 mb-5 flex gap-1 overflow-x-auto scrollbar-none', className)}>
      {items.map((tb) => {
        const Icon = tb.icon;
        const active = pathname === tb.href || pathname.startsWith(tb.href + '/');
        return (
          <Link
            key={tb.href}
            href={tb.href as any}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              active
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200',
            )}
          >
            {Icon && <Icon className="h-4 w-4" />} {tb.label}
            {typeof tb.count === 'number' && tb.count > 0 && (
              <span
                className={cn(
                  'ml-1 text-xs px-1.5 py-0.5 rounded-full tabular-nums',
                  active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600',
                )}
              >
                {tb.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

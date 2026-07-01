'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  k: string;
  label: string;
  icon?: LucideIcon;
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
          </button>
        );
      })}
    </div>
  );
}

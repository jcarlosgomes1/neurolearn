'use client';

import { cn } from '@/lib/utils/cn';

export interface FilterOption {
  k: string;
  label: string;
  count?: number;
}

/**
 * Fila de filtros canónica (pílulas). Um só estilo para todos os hubs — ativo = acento da marca.
 * Substitui os filtros hand-rolled (CRM terracota, Candidaturas pretos, etc.).
 */
export function FilterChips({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly FilterOption[];
  value: string;
  onChange: (k: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-none', className)}>
      {options.map((o) => {
        const active = value === o.k;
        return (
          <button
            key={o.k}
            type="button"
            onClick={() => onChange(o.k)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors',
              active
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
            )}
          >
            {o.label}
            {typeof o.count === 'number' && (
              <span className={cn('tabular-nums', active ? 'text-white/80' : 'text-slate-400')}>· {o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

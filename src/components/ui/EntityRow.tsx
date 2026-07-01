'use client';

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Linha canónica de pessoa/entidade (CRM, mentores, candidaturas, membros, etc.).
 * Letra vem dos tokens .t-item-title / .t-item-sub (globals.css) — consistência estrutural,
 * não depende de nenhum ecrã "lembrar-se" de aplicar tamanhos.
 *
 * leading  = avatar/ícone (opcional)
 * chips    = etiquetas à direita do nome (usar <Chip/>)
 * trailing = elemento à direita (default: chevron quando clicável)
 * children = conteúdo extra por baixo do subtítulo (métricas, etc.)
 */
export function EntityRow({
  leading,
  title,
  subtitle,
  chips,
  trailing,
  onClick,
  className,
  children,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  chips?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  const interactive = !!onClick;
  const Comp: any = interactive ? 'button' : 'div';
  return (
    <Comp
      {...(interactive ? { type: 'button', onClick } : {})}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white text-left',
        interactive && 'hover:border-brand-300 hover:shadow-sm transition-all',
        className,
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="t-item-title truncate">{title}</span>
          {chips}
        </div>
        {subtitle && <div className="t-item-sub truncate">{subtitle}</div>}
        {children}
      </div>
      {trailing !== undefined ? trailing : (interactive && <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />)}
    </Comp>
  );
}

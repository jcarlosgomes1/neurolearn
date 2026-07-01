import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

// Tons semânticos partilhados. Também aceita classes de cor cruas (ex: "bg-amber-100 text-amber-700")
// para migração de chips existentes sem perder a cor por-tipo.
const TONES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-100 text-brand-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700',
  blue: 'bg-blue-100 text-blue-700',
  rose: 'bg-rose-100 text-rose-700',
};

/**
 * Etiqueta/chip canónico. Letra e forma vêm do token .t-chip (globals.css) — impossível divergir.
 * A cor vem de `tone` (tom semântico) ou de classes cruas passadas em `tone`.
 */
export function Chip({ children, tone = 'slate', className }: { children: ReactNode; tone?: string; className?: string }) {
  const toneCls = TONES[tone] || tone;
  return <span className={cn('t-chip', toneCls, className)}>{children}</span>;
}

'use client';
import type { ReactNode } from 'react';

/**
 * Passthrough: NÃO envolve os filhos num wrapper.
 * Um wrapper com animação (animation-fill-mode) cria um contexto de contenção
 * que quebra position:sticky em TODOS os descendentes (header, cartões).
 * A entrada de página é tratada pelo TopLoader; o fade ao nível da página
 * não justifica partir o sticky de toda a plataforma.
 */
export function PageEnter({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

import type { ReactNode } from 'react';

/**
 * Container canonico das paginas de admin.
 * Largura = cockpit (max-w-6xl) por defeito; `wide` (max-w-7xl) apenas para
 * excecoes justificadas (dashboards densos, tabelas largas, editores).
 * Padding homogeneo em todas as paginas (px responsivo + py-6 sm:py-8).
 */
export function AdminPage({ children, wide = false, className = '' }: { children: ReactNode; wide?: boolean; className?: string }) {
  return (
    <div className={`${wide ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}>
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';

/**
 * Largura canónica única (Fase A do design consonante).
 * width="page" → max-w-6xl (marketing, catálogos, admin) — referência PageHero/Empresas.
 * width="read" → max-w-3xl (leitura: artigo, legal, aula de texto).
 * Um único ponto de decisão para larguras → fim do 5xl/7xl disperso.
 */
export function Container({
  width = 'page',
  className = '',
  children,
}: {
  width?: 'page' | 'read';
  className?: string;
  children: ReactNode;
}) {
  const w = width === 'read' ? 'max-w-3xl' : 'max-w-6xl';
  return <div className={`${w} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

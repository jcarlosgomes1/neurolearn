import type { ReactNode } from 'react';

/**
 * Container de largura de pagina, governado pelo token de design --page-max
 * (lido da direcao de design ativa na BD). Muda a largura de TODO o site num so sitio.
 * Default 72rem como fallback se o token nao existir.
 */
export function PageWidth({
  children,
  className = '',
  py = '',
}: {
  children: ReactNode;
  className?: string;
  py?: string;
}) {
  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${py} ${className}`}
      style={{ maxWidth: 'var(--page-max, 72rem)' }}
    >
      {children}
    </div>
  );
}

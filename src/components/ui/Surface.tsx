import type { ElementType, ReactNode } from 'react';

type Elevation = 'flat' | 'raised' | 'embossed';

const RADIUS = {
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
} as const;

export interface SurfaceProps {
  as?: ElementType;
  elevation?: Elevation;
  radius?: keyof typeof RADIUS;
  interactive?: boolean;
  padded?: boolean;
  bordered?: boolean;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}

/**
 * Superficie/cartao reutilizavel com alto-relevo configuravel.
 * elevation: 'flat' (sem sombra) | 'raised' (sombra suave) | 'embossed' (sombra + brilho interno no topo, ar LinkedIn).
 * As sombras vem de CSS vars (--nl-surface-shadow*) emitidas pela direcao de design ativa => config-driven.
 */
export function Surface({
  as: Tag = 'div',
  elevation = 'raised',
  radius = 'lg',
  interactive = false,
  padded = false,
  bordered = true,
  className = '',
  children,
  ...rest
}: SurfaceProps) {
  const elev =
    elevation === 'embossed' ? 'nl-surface-emboss' : elevation === 'raised' ? 'nl-surface' : '';
  const classes = [
    'bg-white',
    RADIUS[radius],
    bordered ? 'border border-slate-200/70' : '',
    elev,
    interactive ? 'nl-surface-int cursor-pointer' : '',
    padded ? 'p-5' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

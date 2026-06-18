import type { ReactNode } from 'react';

/**
 * Hero premium canónico das páginas públicas.
 * Theme-aware: usa exclusivamente tokens de marca (brand-*) e neutros do tema (slate-* remapeados).
 * Um único padrão para todas as páginas → consonância total.
 */
export function PageHero({
  badge,
  title,
  titleAccent,
  subtitle,
  children,
  align = 'left',
}: {
  badge?: ReactNode;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  children?: ReactNode;
  align?: 'left' | 'center';
}) {
  const centered = align === 'center';
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-50/40 border-b border-slate-200/60">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-[15%] h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-brand-400/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 right-[15%] h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-brand-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }} />
      </div>
      <div className={`relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:py-20 lg:py-24 ${centered ? 'text-center' : ''}`}>
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-200 text-xs font-semibold text-brand-700 mb-4 sm:mb-5 shadow-sm max-w-full truncate">
            {badge}
          </div>
        )}
        <h1 className="t-h1 text-slate-900 text-balance">
          {title}{titleAccent ? <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">{titleAccent}</span> : null}
        </h1>
        {subtitle && (
          <p className={`mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 text-pretty leading-relaxed ${centered ? 'max-w-2xl mx-auto' : 'max-w-3xl'}`}>{subtitle}</p>
        )}
        {children && <div className={`mt-7 flex flex-wrap gap-3 ${centered ? 'justify-center' : ''}`}>{children}</div>}
      </div>
    </section>
  );
}

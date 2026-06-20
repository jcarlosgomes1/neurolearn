import type { ReactNode } from 'react';

/**
 * Hero premium canónico das páginas públicas — tratamento "Aurora".
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
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100/40 border-b border-slate-200/60">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-[10%] h-96 w-96 rounded-full bg-brand-400/30 blur-3xl animate-pulse" />
        <div className="absolute top-8 right-[8%] h-80 w-80 rounded-full bg-brand-300/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(60% 55% at 50% 0%, rgb(var(--brand-400) / 0.18), transparent 70%)' }} />
      <div className={`relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 sm:py-20 lg:py-24 ${centered ? 'text-center' : ''}`}>
        {badge && (
          <div className={`inline-flex items-center gap-2 mb-4 sm:mb-5 text-brand-700 ${centered ? 'justify-center' : ''}`}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] truncate">{badge}</span>
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

import type { ReactNode } from 'react';

export function PageHeader({
  badge,
  title,
  subtitle,
  children,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-gradient-to-br from-brand-50 via-white to-brand-50/50 border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-7 sm:py-14 lg:py-16">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-200 text-xs font-medium text-brand-700 mb-3 sm:mb-4 shadow-sm max-w-full truncate">
            {badge}
          </div>
        )}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-2xl text-pretty">{subtitle}</p>
        )}
        {children && <div className="mt-5 sm:mt-6">{children}</div>}
      </div>
    </section>
  );
}

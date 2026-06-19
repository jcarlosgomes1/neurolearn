import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

export type CategoryVariant = 'multicolor' | 'brand-tile' | 'icon-tl-brand' | 'icon-tl-neutral' | 'inline' | 'corner' | 'circle' | 'typographic';

export function CategoryCard({
  name, count, Icon, href, cls, variant = 'icon-tl-brand', arrow = true,
}: {
  name: string;
  count: string;
  Icon: LucideIcon;
  href?: string;
  cls?: string;
  variant?: CategoryVariant;
  arrow?: boolean;
}) {
  const base = 'group relative block rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-brand-200';
  const showArrow = arrow && variant !== 'corner';
  const content = (
    <>
      {variant === 'multicolor' && <div className={`inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br ${cls || 'from-brand-500 to-brand-600'} text-white items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform`}><Icon className="h-6 w-6" strokeWidth={1.75} /></div>}
      {variant === 'brand-tile' && <div className="inline-flex h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 items-center justify-center mb-4"><Icon className="h-6 w-6" strokeWidth={1.75} /></div>}
      {variant === 'circle' && <div className="inline-flex h-9 w-9 rounded-full bg-brand-50 text-brand-600 items-center justify-center mb-4"><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>}
      {variant === 'icon-tl-brand' && <Icon className="h-6 w-6 text-brand-600 mb-4" strokeWidth={1.75} />}
      {variant === 'icon-tl-neutral' && <Icon className="h-6 w-6 text-slate-400 mb-4" strokeWidth={1.75} />}
      {variant === 'corner' && <Icon className="absolute top-5 right-5 h-5 w-5 text-brand-500" strokeWidth={1.75} />}
      {variant === 'inline' ? (
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5 text-brand-600 shrink-0" strokeWidth={1.75} />
          <div className="font-semibold text-slate-900 leading-tight">{name}</div>
        </div>
      ) : (
        <div className={`font-semibold text-slate-900 leading-tight ${variant === 'corner' ? 'pr-7' : ''}`}>{name}</div>
      )}
      <div className="text-sm text-slate-500 mt-1">{count}</div>
      {showArrow && <ArrowUpRight className="absolute bottom-5 right-5 h-4 w-4 text-slate-300 group-hover:text-brand-500 transition-colors" />}
    </>
  );
  if (href) return <Link href={href as any} className={base}>{content}</Link>;
  return <div className={base}>{content}</div>;
}

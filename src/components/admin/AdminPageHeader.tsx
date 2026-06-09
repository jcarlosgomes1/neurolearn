import { Link } from '@/i18n/routing';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface RelatedLink { href: string; label: string; emoji?: string }

interface Props {
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  eyebrowAccent?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  related?: RelatedLink[];
}

export function AdminPageHeader({ backHref, backLabel, eyebrow, eyebrowIcon: EyeIcon, eyebrowAccent = 'text-violet-600', title, description, actions, related }: Props) {
  return (
    <header className="mb-8">
      {backHref && (
        <Link
          href={backHref as any}
          className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {backLabel || 'Voltar'}
        </Link>
      )}
      {eyebrow && (
        <div className={`flex items-center gap-2 ${eyebrowAccent} text-xs font-semibold uppercase tracking-wider mb-1`}>
          {EyeIcon && <EyeIcon className="h-3.5 w-3.5" />} {eyebrow}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {related && related.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {related.map((r) => (
            <Link
              key={r.href}
              href={r.href as any}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 hover:ring-violet-200 transition-colors">
              {r.emoji && <span className="text-sm leading-none">{r.emoji}</span>}
              {r.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

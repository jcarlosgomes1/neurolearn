import { ReactNode } from 'react';
import { Link } from '@/i18n/routing';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  cta?: { label: string; href: string } | { label: string; onClick: () => void };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({ icon, title, description, cta, size = 'md', className = '' }: EmptyStateProps) {
  const paddings = { sm: 'py-8 px-4', md: 'py-12 px-6', lg: 'py-20 px-6' };
  const titleSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 ${paddings[size]} text-center ${className}`}>
      {icon && <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 mb-3">{icon}</div>}
      <h3 className={`font-semibold text-slate-900 mb-1 ${titleSizes[size]}`}>{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md mx-auto">{description}</p>}
      {cta && (
        <div className="mt-4">
          {'href' in cta ? (
            <Link href={cta.href as any} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg">
              {cta.label}
            </Link>
          ) : (
            <button onClick={cta.onClick} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg">
              {cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

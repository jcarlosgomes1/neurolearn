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
  emoji?: string;
  icon?: LucideIcon;
  iconGradient?: string;
  actions?: ReactNode;
  related?: RelatedLink[];
}

export function AdminPageHeader({ backHref, backLabel, eyebrow, eyebrowIcon: EyeIcon, eyebrowAccent = 'text-violet-600', title, description, emoji, icon: TileIcon, iconGradient = 'from-violet-500 to-indigo-600', actions, related }: Props) {
  const TileGlyph = TileIcon || EyeIcon;
  const showTile = Boolean(emoji || TileGlyph);
  return (
    <header className="mb-8">
      {backHref && (
        <Link
          href={backHref as any}
          className="group inline-flex items-center gap-1.5 mb-5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          {backLabel || 'Voltar'}
        </Link>
      )}
      <div className="flex items-start gap-3.5">
        {showTile && (
          <div className={`flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconGradient} text-white shadow-md`}>
            {emoji ? <span className="text-2xl leading-none">{emoji}</span> : (TileGlyph ? <TileGlyph className="h-6 w-6" /> : null)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <div className={`flex items-center gap-2 ${eyebrowAccent} text-xs font-semibold uppercase tracking-wider mb-1`}>
              {EyeIcon && !showTile && <EyeIcon className="h-3.5 w-3.5" />} {eyebrow}
            </div>
          )}
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

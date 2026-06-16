import { Link } from '@/i18n/routing';
import { ChevronRight, type LucideIcon } from 'lucide-react';
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

export function AdminPageHeader({ backHref, backLabel, eyebrow, eyebrowIcon: EyeIcon, eyebrowAccent = 'text-violet-600', title, description, emoji, icon: TileIcon, actions, related }: Props) {
  const TileGlyph = TileIcon || EyeIcon;
  const showTile = Boolean(emoji || TileGlyph);
  const resolvedBack = backHref === '/admin' ? '/admin/overview' : backHref;
  return (
    <header className="mb-6 sm:mb-8">
      {/* Breadcrumb (substitui a antiga pílula "Voltar") */}
      {backHref && (
        <nav aria-label="breadcrumb" className="mb-3 sm:mb-4">
          <ol className="flex items-center gap-1 text-xs font-medium text-slate-400 min-w-0">
            <li className="shrink-0">
              <Link href={resolvedBack as any} className="hover:text-violet-600 transition-colors">
                {backLabel || 'Voltar'}
              </Link>
            </li>
            <li className="shrink-0"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="text-slate-600 font-semibold truncate">{title}</li>
          </ol>
        </nav>
      )}
      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Tile/ícone grande: escondido em mobile (poupa ecrã), visível a partir de sm */}
        {showTile && (
          <div className="hidden sm:inline-flex flex-shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
            {emoji ? <span className="text-xl leading-none">{emoji}</span> : (TileGlyph ? <TileGlyph className="h-5 w-5 text-slate-500" /> : null)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <div className={`flex items-center gap-2 ${eyebrowAccent} text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-1`}>
              {EyeIcon && <EyeIcon className="h-3.5 w-3.5 shrink-0" />} <span className="truncate">{eyebrow}</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">{title}</h1>
          {description && <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {related && related.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
          {related.map((r) => (
            <Link
              key={r.href}
              href={r.href as any}
              className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 hover:ring-violet-200 transition-colors">
              {r.emoji && <span className="text-sm leading-none">{r.emoji}</span>}
              {r.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

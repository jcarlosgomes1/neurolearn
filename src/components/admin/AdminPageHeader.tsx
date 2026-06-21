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

// Deteta um emoji no inicio do titulo para nao o duplicar com o glifo do cabecalho.
const LEADING_EMOJI = /^(\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*)\s*/u;

export function AdminPageHeader({ backHref, backLabel, eyebrow, eyebrowIcon: EyeIcon, eyebrowAccent = 'text-violet-600', title, description, emoji, icon: TileIcon, actions, related }: Props) {
  // Apenas o icone "grande" (sem quadrado). eyebrowIcon ja aparece na eyebrow, por isso nao o repetimos como glifo.
  const TileGlyph = TileIcon;
  const trimmedTitle = (title || '').trim();
  const m = trimmedTitle.match(LEADING_EMOJI);
  const titleEmoji = m ? m[1] : undefined;
  const cleanTitle = titleEmoji ? trimmedTitle.slice(m![0].length) : title;
  const glyph = titleEmoji || emoji; // um unico glifo
  const showGlyph = Boolean(glyph || TileGlyph);
  const resolvedBack = backHref === '/admin' ? '/admin/overview' : backHref;
  return (
    <header className="mb-6 sm:mb-8">
      {backHref && (
        <nav aria-label="breadcrumb" className="mb-3 sm:mb-4">
          <ol className="flex items-center gap-1 text-xs font-medium text-slate-400 min-w-0">
            <li className="shrink-0">
              <Link href={resolvedBack as any} className="hover:text-violet-600 transition-colors">
                {backLabel || 'Voltar'}
              </Link>
            </li>
            <li className="shrink-0"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="text-slate-600 font-semibold truncate">{cleanTitle}</li>
          </ol>
        </nav>
      )}
      <div className="flex items-start gap-2.5 sm:gap-3">
        {showGlyph && (
          <div className="flex-shrink-0 leading-none mt-0.5 sm:mt-1">
            {glyph
              ? <span className="text-3xl sm:text-4xl leading-none">{glyph}</span>
              : (TileGlyph ? <TileGlyph className="h-7 w-7 sm:h-8 sm:w-8 text-slate-700" strokeWidth={1.75} /> : null)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <div className={`flex items-center gap-2 ${eyebrowAccent} text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-1`}>
              {EyeIcon && <EyeIcon className="h-3.5 w-3.5 shrink-0" />} <span className="truncate">{eyebrow}</span>
            </div>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">{cleanTitle}</h1>
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

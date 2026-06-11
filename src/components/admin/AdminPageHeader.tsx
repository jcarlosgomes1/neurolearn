'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  emoji?: string;
  icon?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, emoji, icon, backHref = '/admin', actions }: Props) {
  const t = useTranslations();
  let back = 'Voltar';
  try { const v = t('shell.back'); if (v && v !== 'shell.back') back = v; } catch {}
  return (
    <div className="mb-6">
      <Link href={backHref as any}
        className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95">
        <ArrowLeft className="h-3.5 w-3.5" /> {back}
      </Link>
      <div className="mt-4 flex items-start gap-3">
        <div className="flex-shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md text-xl leading-none">
          {icon ?? <span>{emoji ?? '\u2022'}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex-shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

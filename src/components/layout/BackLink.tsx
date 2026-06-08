'use client';

import { Link, useRouter } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Botão "Voltar" universal: pode receber href explícito OU usar router.back() se omitido.
 * Estilo discreto, hover slide.
 */
export function BackLink({ href, label, className }: { href?: string; label?: ReactNode; className?: string }) {
  const router = useRouter();
  const Comp: any = href ? Link : 'button';
  const props: any = href
    ? { href: href as any }
    : { onClick: () => router.back(), type: 'button' };
  return (
    <Comp
      {...props}
      className={
        'group inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors ' +
        (className || '')
      }>
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{label || 'Voltar'}</span>
    </Comp>
  );
}

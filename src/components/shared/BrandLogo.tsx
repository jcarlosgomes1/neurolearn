'use client';

import { useTranslations } from 'next-intl';

/**
 * Logótipo único da marca (ícone + wordmark). Fonte única — alterar aqui muda em todo o lado.
 * O wrapper é inline-flex; passa `className` para cor/tamanho do conjunto, `iconClassName`/`textClassName` para ajustes finos.
 */
export function BrandLogo({
  className = '',
  iconClassName = '',
  textClassName = '',
  emojiSize = 'text-2xl',
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  emojiSize?: string;
}) {
  const t = useTranslations();
  return (
    <span className={`inline-flex items-center gap-2 font-bold ${className}`}>
      <span className={`${emojiSize} ${iconClassName}`} aria-hidden>🧠</span>
      <span className={textClassName}>{t('brand.name')}</span>
    </span>
  );
}

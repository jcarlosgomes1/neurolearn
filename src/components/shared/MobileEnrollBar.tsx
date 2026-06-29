'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { EnrollButton } from './EnrollButton';

/**
 * Barra de ação fixa no fundo, apenas em mobile (lg:hidden).
 * Escondida no topo; desliza para dentro quando o utilizador rola além
 * do primeiro ecrã (a zona inicial onde a decisão de inscrição já está visível).
 * Reutiliza EnrollButton (mesma lógica de auth/inscrição) — zero duplicação.
 * Reutilizável em qualquer página de produto (curso marketplace agora; tenant herda).
 */
export function MobileEnrollBar({
  courseId,
  priceLabel,
  courseTitle,
  isFree,
  enrolled,
  continueHref,
}: {
  courseId: string;
  priceLabel: string;
  courseTitle?: string;
  isFree?: boolean;
  enrolled?: boolean;
  continueHref?: string;
}) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Aparece depois de rolar ~70% da altura do primeiro ecrã.
    const threshold = () => Math.round(window.innerHeight * 0.7);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold());
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(110%)',
        backgroundColor: 'white',
        borderTop: '1px solid rgb(233 229 222)',
        boxShadow: '0 -8px 24px -12px rgba(66,61,55,0.25)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="px-4 py-3 flex items-center gap-4">
        <div className="flex-shrink-0">
          {isFree ? (
            <span className="font-display font-bold text-xl" style={{ color: 'rgb(15 138 128)' }}>
              {t('cdp.free')}
            </span>
          ) : (
            <span className="font-display font-bold text-xl" style={{ color: 'rgb(28 25 22)' }}>
              {priceLabel}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {enrolled && continueHref ? (
            <Link
              href={continueHref as any}
              className="btn-primary w-full inline-flex items-center justify-center py-3 text-base font-semibold"
            >
              {t('cdp.go_to_course')}
            </Link>
          ) : (
            <EnrollButton courseId={courseId} priceLabel={priceLabel} courseTitle={courseTitle} />
          )}
        </div>
      </div>
    </div>
  );
}

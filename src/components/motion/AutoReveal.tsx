'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Auto-revelação ao scroll para páginas públicas, sem flicker:
// só anima elementos que começam ABAIXO da dobra (fora de vista). Os de topo
// ficam intactos (a entrada de página trata deles). Governado por data-motion
// (toggle por direção de design) e por prefers-reduced-motion. O conteúdo está
// sempre no DOM e visível por defeito — sem impacto em SEO / no-JS.
const DENY = ['/admin', '/learn', '/aprender', '/conta', '/teach', '/atelier', '/onboarding', '/auth', '/login', '/register', '/join', '/convite', '/verify', '/demo', '/status', '/search', '/em-breve'];

export function AutoReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (document.documentElement.dataset.motion === 'off') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const seg = (pathname || '/').replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
    if (seg === '/') return; // homepage tem Reveal explícito
    if (DENY.some((p) => seg === p || seg.startsWith(p + '/'))) return;

    const main = document.querySelector('main');
    if (!main) return;

    const vh = window.innerHeight;
    const observed: HTMLElement[] = [];
    for (const el of Array.from(main.children) as HTMLElement[]) {
      const tag = el.tagName.toLowerCase();
      if (['header', 'footer', 'script', 'style', 'nav'].includes(tag)) continue;
      if (el.classList.contains('nl-reveal')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.9) continue; // já visível → não tocar
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1)';
      el.style.willChange = 'opacity, transform';
      observed.push(el);
    }
    if (observed.length === 0) return;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.opacity = '1';
          el.style.transform = 'none';
          io.unobserve(el);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    observed.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      observed.forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
        el.style.transition = '';
        el.style.willChange = '';
      });
    };
  }, [pathname]);

  return null;
}

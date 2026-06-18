import { getNavItems, type NavItem } from '@/lib/api/nav-items';
import { getTranslations } from 'next-intl/server';
import FooterClient, { type FooterItem } from './FooterClient';

interface FooterData { brand?: string }

export async function Footer({ data }: { data: FooterData }) {
  const t = await getTranslations();
  const [platform, solutions, company, legal] = await Promise.all([
    getNavItems('footer_platform'),
    getNavItems('footer_solutions'),
    getNavItems('footer_company'),
    getNavItems('footer_legal'),
  ]);

  function safeT(key: string, fb = ''): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  // Resolve os labels NO SERVIDOR (onde o i18n resolve corretamente).
  // O cliente passa a renderizar strings já resolvidas — sem re-tradução, sem mismatch.
  function resolve(items: NavItem[]): FooterItem[] {
    return items.map((it) => {
      let label = it.label_override || '';
      if (!label && it.i18n_key) label = safeT(it.i18n_key, '');
      if (!label) label = (it.href || '').split('/').filter(Boolean).pop() || it.href || '';
      return { ...it, label };
    });
  }

  const strings = {
    platform: safeT('footer.platform', 'Plataforma'),
    solutions: safeT('footer.solutions', 'Soluções'),
    company: safeT('nav.company', 'Empresa'),
    legal: safeT('footer.legal', 'Legal'),
    brandTagline: safeT('footer.brand_tagline', ''),
    brandName: safeT('brand.name', 'NeuroLearn'),
    rights: safeT('footer.rights', ''),
    builtWithCare: safeT('footer.built_with_care', ''),
  };

  return (
    <FooterClient
      data={data}
      platform={resolve(platform)}
      solutions={resolve(solutions)}
      company={resolve(company)}
      legal={resolve(legal)}
      strings={strings}
    />
  );
}

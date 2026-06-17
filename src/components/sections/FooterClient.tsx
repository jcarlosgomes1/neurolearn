'use client';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { NavItem } from '@/lib/api/nav-items';
import { BrandLogo } from '@/components/shared/BrandLogo';

interface FooterData { brand?: string }

export default function FooterClient({ data, platform, solutions, company, legal }: {
  data: FooterData; platform: NavItem[]; solutions: NavItem[]; company: NavItem[]; legal: NavItem[];
}) {
  const t = useTranslations();
  const year = new Date().getFullYear();

  function label(item: NavItem): string {
    if (item.label_override) return item.label_override;
    if (item.i18n_key) {
      try {
        const v = t(item.i18n_key as any);
        if (v && v !== item.i18n_key) return v;
      } catch {}
    }
    return (item.href || '').split('/').filter(Boolean).pop() || item.href || '';
  }

  function renderItem(item: NavItem) {
    if (!item.href) return null;
    const lbl = label(item);
    if (item.external || item.href.startsWith('http') || item.href.startsWith('mailto:')) {
      return (
        <li key={item.id}>
          <a href={item.href} target={item.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener"
            className="hover:text-white transition-colors">{lbl}{item.badge && <span className="ml-1.5 text-[9px] bg-indigo-600 text-white px-1 py-0.5 rounded">{item.badge}</span>}</a>
        </li>
      );
    }
    return (
      <li key={item.id}>
        <Link href={item.href as any} className="hover:text-white transition-colors">
          {lbl}{item.badge && <span className="ml-1.5 text-[9px] bg-indigo-600 text-white px-1 py-0.5 rounded">{item.badge}</span>}
        </Link>
      </li>
    );
  }

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <BrandLogo className="text-white text-lg" />
            <p className="mt-3 text-sm max-w-xs leading-relaxed">
              {data?.brand || t('footer.brand_tagline')}
            </p>
            <div className="mt-5 flex gap-3">
              <a href="https://www.linkedin.com/company/neurolearn" target="_blank" rel="noopener" aria-label="LinkedIn" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-brand-600 flex items-center justify-center transition-colors text-white">in</a>
              <a href="https://www.instagram.com/neurolearn" target="_blank" rel="noopener" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-brand-600 flex items-center justify-center transition-colors text-white">ig</a>
              <a href="https://www.youtube.com/@neurolearn" target="_blank" rel="noopener" aria-label="YouTube" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-brand-600 flex items-center justify-center transition-colors text-white">yt</a>
              <a href="https://x.com/neurolearn" target="_blank" rel="noopener" aria-label="X" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-brand-600 flex items-center justify-center transition-colors text-white">X</a>
            </div>
          </div>

          {platform.length > 0 && (
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">{t('footer.platform')}</h3>
              <ul className="space-y-2 text-sm">{platform.map(renderItem)}</ul>
            </div>
          )}

          {solutions.length > 0 && (
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">{t('footer.solutions')}</h3>
              <ul className="space-y-2 text-sm">{solutions.map(renderItem)}</ul>
            </div>
          )}

          {company.length > 0 && (
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">{t('nav.company')}</h3>
              <ul className="space-y-2 text-sm">{company.map(renderItem)}</ul>
            </div>
          )}

          {legal.length > 0 && (
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">{t('footer.legal')}</h3>
              <ul className="space-y-2 text-sm">{legal.map(renderItem)}</ul>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© {year} {t('brand.name')}. {t('footer.rights')}.</span>
          <span className="text-slate-500">{t('footer.built_with_care')}</span>
        </div>
      </div>
    </footer>
  );
}

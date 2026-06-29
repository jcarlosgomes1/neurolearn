'use client';
import { Link } from '@/i18n/routing';
import type { NavItem } from '@/lib/api/nav-items';
import { BrandLogo } from '@/components/shared/BrandLogo';

export type FooterItem = NavItem & { label: string };

interface FooterData { brand?: string }
interface FooterStrings {
  platform: string; solutions: string; company: string; legal: string;
  brandTagline: string; brandName: string; rights: string; builtWithCare: string;
}

export default function FooterClient({ data, platform, solutions, company, legal, strings }: {
  data: FooterData; platform: FooterItem[]; solutions: FooterItem[]; company: FooterItem[]; legal: FooterItem[];
  strings: FooterStrings;
}) {
  const year = new Date().getFullYear();

  function renderItem(item: FooterItem) {
    if (!item.href) return null;
    const lbl = item.label;
    if (item.external || item.href.startsWith('http') || item.href.startsWith('mailto:')) {
      return (
        <li key={item.id}>
          <a href={item.href} target={item.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener"
            className="hover:text-white transition-colors">{lbl}{item.badge && <span className="ml-1.5 text-[9px] bg-brand-600 text-white px-1 py-0.5 rounded">{item.badge}</span>}</a>
        </li>
      );
    }
    return (
      <li key={item.id}>
        <Link href={item.href as any} className="hover:text-white transition-colors">
          {lbl}{item.badge && <span className="ml-1.5 text-[9px] bg-brand-600 text-white px-1 py-0.5 rounded">{item.badge}</span>}
        </Link>
      </li>
    );
  }

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto px-4 py-14" style={{ maxWidth: 'var(--page-max, 72rem)' }}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <BrandLogo className="text-white text-lg" />
            <p className="mt-3 text-sm max-w-xs leading-relaxed">
              {data?.brand || strings.brandTagline}
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
              <h3 className="text-white font-semibold text-sm mb-3">{strings.platform}</h3>
              <ul className="space-y-2 text-sm">{platform.map(renderItem)}</ul>
            </div>
          )}

          {solutions.length > 0 && (
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">{strings.solutions}</h3>
              <ul className="space-y-2 text-sm">{solutions.map(renderItem)}</ul>
            </div>
          )}

          {company.length > 0 && (
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">{strings.company}</h3>
              <ul className="space-y-2 text-sm">{company.map(renderItem)}</ul>
            </div>
          )}

          {legal.length > 0 && (
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">{strings.legal}</h3>
              <ul className="space-y-2 text-sm">{legal.map(renderItem)}</ul>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© {year} {strings.brandName}. {strings.rights}.</span>
          <span className="text-slate-500">{strings.builtWithCare}</span>
        </div>
      </div>
    </footer>
  );
}

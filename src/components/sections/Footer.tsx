import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface FooterData { brand?: string }

export function Footer({ data }: { data: FooterData }) {
  const t = useTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-bold text-white text-lg">
              <span className="text-2xl">🧠</span>
              <span>NeuroLearn</span>
            </div>
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

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">{t('footer.platform')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={'/cursos' as any} className="hover:text-white transition-colors">{t('nav.courses')}</Link></li>
              <li><Link href={'/essentials' as any} className="hover:text-white transition-colors">{t('nav.essentials')}</Link></li>
              <li><Link href={'/empresas' as any} className="hover:text-white transition-colors">{t('nav.business')}</Link></li>
              <li><Link href={'/blog' as any} className="hover:text-white transition-colors">{t('nav.blog')}</Link></li>
              <li><Link href={'/candidatar' as any} className="hover:text-white transition-colors">{t('nav.teach')} →</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">{t('nav.company')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={'/legal/about' as any} className="hover:text-white transition-colors">{t('footer.about')}</Link></li>
              <li><Link href={'/legal/faq' as any} className="hover:text-white transition-colors">{t('footer.faq')}</Link></li>
              <li><a href="mailto:hello@neurolearn.pt" className="hover:text-white transition-colors">{t('footer.contact')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">{t('nav.legal')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={'/legal/terms' as any} className="hover:text-white transition-colors">{t('footer.terms')}</Link></li>
              <li><Link href={'/legal/privacy' as any} className="hover:text-white transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link href={'/legal/cookies' as any} className="hover:text-white transition-colors">{t('footer.cookies')}</Link></li>
              <li><Link href={'/legal/refunds' as any} className="hover:text-white transition-colors">{t('footer.refunds')}</Link></li>
              <li><Link href={'/legal/legal-notice' as any} className="hover:text-white transition-colors">{t('footer.legal')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© {year} NeuroLearn. {t('footer.rights')}.</span>
          <span className="text-slate-500">{t('footer.built_with_care')}</span>
        </div>
      </div>
    </footer>
  );
}

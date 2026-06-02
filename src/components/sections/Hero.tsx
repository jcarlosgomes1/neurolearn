import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface HeroData {
  badge?: string;
  title: string;
  subtitle: string;
  btn_primary?: string;
  btn_secondary?: string;
  trust?: string;
}

export function Hero({ data }: { data: HeroData }) {
  const t = useTranslations();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-50/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(91,108,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(91,108,255,0.08),transparent_60%)]" />

      <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-32">
        {data.badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-200 text-xs font-medium text-brand-700 mb-6 shadow-sm animate-fade-in">
            {data.badge}
          </div>
        )}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 max-w-3xl tracking-tight text-balance leading-[1.1] animate-slide-up">
          {data.title}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl text-pretty leading-relaxed animate-slide-up [animation-delay:0.1s]">
          {data.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap gap-3 animate-slide-up [animation-delay:0.2s]">
          <Link href={'/register' as any} className="btn-primary text-base px-6 py-3">
            {data.btn_primary || t('cms.fallback.start_free')}
          </Link>
          <Link href={'/cursos' as any} className="btn-secondary text-base px-6 py-3">
            {data.btn_secondary || t('coming_soon.see_courses')}
          </Link>
        </div>
        {data.trust && (
          <p className="mt-8 text-sm text-slate-500 animate-fade-in [animation-delay:0.4s]">
            ⭐⭐⭐⭐⭐ {data.trust}
          </p>
        )}
      </div>
    </section>
  );
}

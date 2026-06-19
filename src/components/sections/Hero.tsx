import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';

interface HeroData {
  badge?: string;
  title: string;
  subtitle: string;
  btn_primary?: string;
  btn_secondary?: string;
  trust?: string;
  trust_stars?: number;
}

export function Hero({ data }: { data: HeroData }) {
  const t = useTranslations();
  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--paper)' }}>
      {/* halos do acento — seguem o tema ativo */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(circle at 28% 18%, var(--accent-tint), transparent 55%), radial-gradient(circle at 78% 62%, var(--accent-tint), transparent 60%)',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-32">
        {data.badge && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 shadow-sm animate-fade-in"
            style={{
              background: 'color-mix(in srgb, var(--card) 78%, transparent)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid var(--line)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent-bright)' }} />
            <span className="t-eyebrow" style={{ color: 'var(--accent)' }}>{data.badge}</span>
          </div>
        )}
        <h1 className="t-display max-w-3xl text-balance animate-slide-up" style={{ color: 'var(--ink)' }}>
          {data.title}
        </h1>
        <p
          className="mt-6 text-lg sm:text-xl max-w-2xl text-pretty leading-relaxed animate-slide-up [animation-delay:0.1s]"
          style={{ color: 'var(--ink-2)' }}
        >
          {data.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap gap-3 animate-slide-up [animation-delay:0.2s]">
          <Link
            href={'/register' as any}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}
          >
            {data.btn_primary || t('cms.fallback.start_free')}
          </Link>
          <Link
            href={'/cursos' as any}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition-colors"
            style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--card)' }}
          >
            {data.btn_secondary || t('coming_soon.see_courses')}
          </Link>
        </div>
        {data.trust && (
          <p className="mt-8 text-sm animate-fade-in [animation-delay:0.4s] flex items-center gap-2" style={{ color: 'var(--ink-3)' }}>
            {!!data.trust_stars && data.trust_stars > 0 && (<span className="inline-flex items-center gap-0.5" style={{ color: 'var(--accent)' }}>{Array.from({ length: Math.min(5, Math.max(0, Math.round(data.trust_stars))) }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-current" />))}</span>)}
            <span>{data.trust}</span>
          </p>
        )}
      </div>
    </section>
  );
}

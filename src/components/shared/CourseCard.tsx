import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { fmtCents } from '@/lib/utils/cn';
import { Star, Users } from 'lucide-react';

const LANG_NAMES: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };

export interface CourseCardData {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji?: string | null;
  price_cents: number;
  currency?: string | null;
  rating_avg?: number | string | null;
  rating_count?: number | null;
  enrollments_count?: number | null;
  level?: string | null;
  course_type?: string | null;
  available_langs?: string[] | null;
  is_fallback?: boolean | null;
  hero_image_url?: string | null;
}

const INK = 'rgb(28 25 22)', INK2 = 'rgb(92 84 76)', INK3 = 'rgb(154 144 133)', LINE = 'rgb(233 229 222)';

export function CourseCard({ course, ratingMin = 5, enrollMin = 25 }: { course: CourseCardData; ratingMin?: number; enrollMin?: number }) {
  const t = useTranslations('course_card');
  const locale = useLocale();
  const langs = (course.available_langs || []).filter(Boolean);
  const notInMyLang = !!course.is_fallback && langs.length > 0 && !langs.includes(locale);
  const showRating = (course.rating_count ?? 0) >= ratingMin && !!course.rating_avg;
  const showEnroll = (course.enrollments_count ?? 0) >= enrollMin;
  const isNew = !showRating && !showEnroll;
  const isFree = !course.price_cents || course.price_cents === 0;
  return (
    <Link
      href={`/curso/${course.id}` as any}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white transition-all hover:shadow-[0_12px_32px_-12px_rgba(66,61,55,0.25)]"
      style={{ border: `1px solid ${LINE}` }}
    >
      {/* imagem */}
      <div className="aspect-[16/10] w-full overflow-hidden relative" style={{ backgroundColor: 'rgb(245 243 239)' }}>
        {course.hero_image_url ? (
          <img src={course.hero_image_url} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{course.emoji || '📚'}</div>
        )}
        {course.level && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: INK2 }}>{course.level}</span>
        )}
      </div>
      {/* corpo */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start gap-2 mb-2 flex-wrap">
          {notInMyLang && (
            <span title={langs.map((l) => LANG_NAMES[l] || l).join(', ')} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>
              {langs.map((l) => l.toUpperCase()).join(' · ')}
            </span>
          )}
          {course.course_type === 'pro' && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: 'rgb(237 233 254)', color: 'rgb(109 40 217)' }}>{t('pro')}</span>
          )}
          {isNew && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: 'rgb(209 250 229)', color: 'rgb(4 120 87)' }}>{t('new')}</span>
          )}
        </div>
        <h3 className="font-display font-bold leading-snug" style={{ fontSize: '1.2rem', color: INK }}>{course.title}</h3>
        {course.subtitle && <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: INK2 }}>{course.subtitle}</p>}
        {showEnroll && (
          <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: INK3 }}>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {Number(course.enrollments_count).toLocaleString(locale)}</span>
          </div>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between">
          {isFree ? (
            <span className="font-display font-bold text-lg" style={{ color: 'rgb(15 138 128)' }}>{t('free')}</span>
          ) : (
            <span className="font-display font-bold text-lg" style={{ color: INK }}>{fmtCents(course.price_cents, course.currency || 'EUR')}</span>
          )}
          {showRating ? (
            <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'rgb(180 88 58)' }}>
              <Star className="h-3.5 w-3.5 fill-current" /> {Number(course.rating_avg).toFixed(1)}
            </span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: 'rgb(180 88 58)' }}>{t('view') || 'Ver curso →'}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

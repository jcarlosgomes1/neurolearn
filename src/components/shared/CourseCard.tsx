import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { fmtCents } from '@/lib/utils/cn';

const LANG_NAMES: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };

export interface CourseCardData {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji?: string | null;
  price_cents: number;
  currency?: string | null;
  rating_avg?: number | string | null;
  enrollments_count?: number | null;
  level?: string | null;
  course_type?: string | null;
  available_langs?: string[] | null;
  is_fallback?: boolean | null;
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const t = useTranslations('course_card');
  const locale = useLocale();
  const langs = (course.available_langs || []).filter(Boolean);
  const notInMyLang = !!course.is_fallback && langs.length > 0 && !langs.includes(locale);
  return (
    <Link
      href={`/curso/${course.id}` as any}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-brand-200 transition-all flex flex-col group"
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left">
        {course.emoji || '📚'}
      </div>
      <h3 className="font-semibold text-slate-900 text-lg leading-snug">{course.title}</h3>
      {course.subtitle && (
        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{course.subtitle}</p>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
        {notInMyLang && (
          <span
            title={langs.map((l) => LANG_NAMES[l] || l).join(', ')}
            className="px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
            style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}
          >
            🌐 {langs.map((l) => l.toUpperCase()).join(' · ')}
          </span>
        )}
        {course.level && (
          <span className="px-2 py-0.5 rounded-full bg-slate-100">{course.level}</span>
        )}
        {course.course_type === 'pro' && (
          <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
            {t('pro')}
          </span>
        )}
        {course.enrollments_count && course.enrollments_count > 0 ? (
          <span>👥 {course.enrollments_count}</span>
        ) : null}
      </div>
      <div className="mt-auto pt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-brand-700">
          {fmtCents(course.price_cents, course.currency || 'EUR')}
        </span>
        {course.rating_avg ? (
          <span className="text-sm text-amber-600">
            ★ {Number(course.rating_avg).toFixed(1)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

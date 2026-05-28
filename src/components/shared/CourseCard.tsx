import { Link } from '@/i18n/routing';
import { fmtCents } from '@/lib/utils/cn';

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
}

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/curso/${course.id}` as any}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-brand-200 transition-all flex flex-col group"
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform origin-left">
        {course.emoji || '\u{1F4DA}'}
      </div>
      <h3 className="font-semibold text-slate-900 text-lg leading-snug">{course.title}</h3>
      {course.subtitle && (
        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{course.subtitle}</p>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        {course.level && (
          <span className="px-2 py-0.5 rounded-full bg-slate-100">{course.level}</span>
        )}
        {course.course_type === 'pro' && (
          <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
            Pro
          </span>
        )}
        {course.enrollments_count && course.enrollments_count > 0 ? (
          <span>\u{1F465} {course.enrollments_count}</span>
        ) : null}
      </div>
      <div className="mt-auto pt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-brand-700">
          {fmtCents(course.price_cents, course.currency || 'EUR')}
        </span>
        {course.rating_avg ? (
          <span className="text-sm text-amber-600">
            \u2605 {Number(course.rating_avg).toFixed(1)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

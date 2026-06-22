import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { PreviewAs } from '@/components/primitives/PreviewAs';
import { CourseTabs } from './CourseTabs';

export default async function CourseWorkspaceLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: course } = await sb.from('nl_courses').select('id, title, published, instructor_id').eq('id', id).maybeSingle();
  let instructorName: string | null = null;
  if (course?.instructor_id) {
    const { data: ins } = await sb.from('nl_instructors').select('display_name').eq('id', course.instructor_id).maybeSingle();
    instructorName = ins?.display_name ?? null;
  }
  const t = await getTranslations();

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Link href={'/admin/cursos' as any} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />{t('course_ws.back')}
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('course_ws.eyebrow')}</div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 truncate">{course?.title || '—'}</h1>
                {course && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {course.published ? t('course_ws.status.published') : t('course_ws.status.draft')}
                  </span>
                )}
                {course?.instructor_id && (
                  <Link href={`/admin/instrutor/${course.instructor_id}` as any} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200 rounded-full px-2 py-0.5 hover:bg-emerald-100">
                    <GraduationCap className="w-3 h-3" />{instructorName || 'Instrutor'}
                  </Link>
                )}
              </div>
            </div>
            {course && <PreviewAs courseId={course.id} />}
          </div>
          <div className="mt-3">
            <CourseTabs courseId={id} />
          </div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

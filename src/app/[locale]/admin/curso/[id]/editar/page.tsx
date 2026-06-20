import { CourseEditor } from '@/components/course-editor/CourseEditor';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { GraduationCap, User, Users, ExternalLink, ArrowUpRight } from 'lucide-react';

export const metadata = { title: 'Editar curso · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: course } = await sb.from('nl_courses').select('id, title, instructor_id').eq('id', id).maybeSingle();
  let instructorName: string | null = null;
  if (course?.instructor_id) {
    const { data: ins } = await sb.from('nl_instructors').select('display_name').eq('id', course.instructor_id).maybeSingle();
    instructorName = ins?.display_name ?? null;
  }

  return (
    <>
      {course && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {course.instructor_id && (
              <>
                <Link href={`/admin/instrutor/${course.instructor_id}` as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 transition-colors">
                  <GraduationCap className="h-3.5 w-3.5" /> {instructorName || 'Instrutor'} <ArrowUpRight className="h-3 w-3" />
                </Link>
                <Link href={`/admin/users/${course.instructor_id}` as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 transition-colors">
                  <User className="h-3.5 w-3.5" /> Perfil
                </Link>
              </>
            )}
            <Link href={`/admin/curso/${id}/alunos` as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-100 transition-colors">
              <Users className="h-3.5 w-3.5" /> Alunos
            </Link>
            <Link href={`/curso/${id}` as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" /> Ver público
            </Link>
          </div>
        </div>
      )}
      <CourseEditor courseId={id} backHref="/admin/cursos" mode="admin" />
    </>
  );
}

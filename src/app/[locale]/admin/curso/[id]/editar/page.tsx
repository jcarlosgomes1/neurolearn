import { CourseEditor } from '@/components/course-editor/CourseEditor';

export const metadata = { title: 'Editar curso · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseEditor courseId={id} backHref="/admin/cursos" mode="admin" />;
}

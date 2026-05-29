import { Header } from '@/components/layout/Header';
import { CourseEditor } from '../../../teach/curso/[id]/editar/CourseEditor';

export const metadata = { title: 'Editar curso · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <CourseEditor courseId={id} backHref="/admin/cursos" mode="admin" />
      </main>
    </>
  );
}

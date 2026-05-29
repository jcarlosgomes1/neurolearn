import { Header } from '@/components/layout/Header';
import { CourseEditor } from './CourseEditor';

export const metadata = { title: 'Editar curso' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <CourseEditor courseId={id} backHref="/teach" mode="instructor" />
      </main>
    </>
  );
}

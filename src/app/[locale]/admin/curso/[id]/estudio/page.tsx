import { CourseStudioPanel } from '@/components/studio/CourseStudioPanel';

export const metadata = { title: 'Estúdio · Curso' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <CourseStudioPanel courseId={id} />
    </div>
  );
}

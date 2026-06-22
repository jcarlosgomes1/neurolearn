import { CourseRitmoPanel } from '@/components/course/CourseRitmoPanel';

export const metadata = { title: 'Ritmo · Curso' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <CourseRitmoPanel courseId={id} />
    </div>
  );
}

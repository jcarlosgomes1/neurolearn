import { CourseSeoPanel } from '@/components/course/CourseSeoPanel';

export const metadata = { title: 'SEO · Curso' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <CourseSeoPanel courseId={id} />
    </div>
  );
}

import { CourseTermsPanel } from '@/components/course/CourseTermsPanel';

export const metadata = { title: 'Termos · Curso' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <CourseTermsPanel courseId={id} />
    </div>
  );
}

import { Header } from '@/components/layout/Header';
import { CourseGenerationProgress } from './CourseGenerationProgress';

export const metadata = { title: 'Geração de curso · Admin' };

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <CourseGenerationProgress jobId={jobId} />
      </main>
    </>
  );
}

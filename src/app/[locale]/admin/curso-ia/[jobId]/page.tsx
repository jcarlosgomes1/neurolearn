import { CourseGenerationProgress } from './CourseGenerationProgress';

export const metadata = { title: 'Geração de curso · Admin' };

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return (
    <>

        <CourseGenerationProgress jobId={jobId} />
      
    </>
  );
}

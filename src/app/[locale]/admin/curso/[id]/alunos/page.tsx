import { CourseStudentsClient } from './CourseStudentsClient';

export const metadata = { title: 'Alunos do curso · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseStudentsClient courseId={id} />;
}

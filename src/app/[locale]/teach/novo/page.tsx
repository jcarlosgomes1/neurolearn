import { Header } from '@/components/layout/Header';
import { CreateCourseForm } from './CreateCourseForm';

export const metadata = { title: 'Criar curso' };

export default function NewCoursePage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <CreateCourseForm />
      </main>
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { CourseGeneratorForm } from './CourseGeneratorForm';

export const metadata = { title: 'Gerar curso com IA · Admin' };

export default function Page() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <CourseGeneratorForm />
      </main>
    </>
  );
}

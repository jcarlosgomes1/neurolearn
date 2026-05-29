import { Header } from '@/components/layout/Header';
import { TutorConfigForm } from './TutorConfigForm';

export const metadata = { title: 'Tutor AI · Admin' };

export default function Page() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <TutorConfigForm />
      </main>
    </>
  );
}

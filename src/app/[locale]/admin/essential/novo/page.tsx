import { Header } from '@/components/layout/Header';
import { NewEssentialForm } from './NewEssentialForm';

export const metadata = { title: 'Novo AI Essential · Admin' };

export default function Page() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <NewEssentialForm />
      </main>
    </>
  );
}

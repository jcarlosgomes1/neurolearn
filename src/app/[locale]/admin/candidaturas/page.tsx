import { Header } from '@/components/layout/Header';
import { CandidaturasList } from './CandidaturasList';

export const metadata = { title: 'Candidaturas a instrutor · Admin' };

export default function Page() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <CandidaturasList />
      </main>
    </>
  );
}

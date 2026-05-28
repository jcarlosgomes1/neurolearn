import { Header } from '@/components/layout/Header';
import { LearnDashboard } from './LearnDashboard';

export const metadata = { title: 'A minha aprendizagem' };

export default function LearnPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <LearnDashboard />
      </main>
    </>
  );
}

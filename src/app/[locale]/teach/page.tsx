import { Header } from '@/components/layout/Header';
import { TeachDashboard } from './TeachDashboard';

export const metadata = { title: 'Painel instrutor' };

export default function TeachPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <TeachDashboard />
      </main>
    </>
  );
}

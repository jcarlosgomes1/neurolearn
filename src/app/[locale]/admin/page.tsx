import { Header } from '@/components/layout/Header';
import { AdminCockpit } from './AdminCockpit';

export const metadata = { title: 'Cockpit Admin' };

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <AdminCockpit />
      </main>
    </>
  );
}

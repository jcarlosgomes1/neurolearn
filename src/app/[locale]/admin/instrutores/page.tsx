import { Header } from '@/components/layout/Header';
import { AdminInstructors } from './AdminInstructors';

export const metadata = { title: 'Instrutores · Admin' };

export default function AdminInstructorsPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <AdminInstructors />
      </main>
    </>
  );
}

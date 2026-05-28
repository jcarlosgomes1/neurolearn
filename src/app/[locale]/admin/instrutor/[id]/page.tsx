import { Header } from '@/components/layout/Header';
import { AdminInstructorDetail } from './AdminInstructorDetail';

export const metadata = { title: 'Painel do instrutor · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <AdminInstructorDetail instructorId={id} />
      </main>
    </>
  );
}

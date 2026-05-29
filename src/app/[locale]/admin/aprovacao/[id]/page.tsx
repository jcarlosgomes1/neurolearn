import { Header } from '@/components/layout/Header';
import { ApprovalDetail } from './ApprovalDetail';

export const metadata = { title: 'Aprovação · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <ApprovalDetail approvalId={id} />
      </main>
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { AIFeaturesForm } from './AIFeaturesForm';

export const metadata = { title: 'AI Features · Instrutor' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <AIFeaturesForm instructorId={id} />
      </main>
    </>
  );
}

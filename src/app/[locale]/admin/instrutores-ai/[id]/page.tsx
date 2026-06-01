import { AIFeaturesForm } from './AIFeaturesForm';

export const metadata = { title: 'AI Features · Instrutor' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>

        <AIFeaturesForm instructorId={id} />
      
    </>
  );
}

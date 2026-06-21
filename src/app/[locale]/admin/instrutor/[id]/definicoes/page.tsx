import { InstrutorDefinicoesPanel } from '@/components/instrutor/InstrutorDefinicoesPanel';

export const metadata = { title: 'Definições · Instrutor' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InstrutorDefinicoesPanel instructorId={id} />;
}

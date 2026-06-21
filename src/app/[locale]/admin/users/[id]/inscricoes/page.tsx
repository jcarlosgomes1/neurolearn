import { AlunoInscricoesPanel } from '@/components/aluno/AlunoInscricoesPanel';

export const metadata = { title: 'Inscrições · Aluno' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AlunoInscricoesPanel userId={id} />;
}

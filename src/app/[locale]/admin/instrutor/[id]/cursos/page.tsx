import { InstrutorCursosPanel } from '@/components/instrutor/InstrutorCursosPanel';

export const metadata = { title: 'Cursos · Instrutor' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InstrutorCursosPanel instructorId={id} />;
}

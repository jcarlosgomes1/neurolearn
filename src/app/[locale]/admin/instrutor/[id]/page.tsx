import { InstructorDossier } from './InstructorDossier';

export const metadata = { title: 'Ficha do instrutor · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InstructorDossier instructorId={id} />;
}

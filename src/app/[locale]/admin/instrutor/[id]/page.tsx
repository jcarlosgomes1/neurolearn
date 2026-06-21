import { AdminInstructorDetail } from './AdminInstructorDetail';

export const metadata = { title: 'Painel do instrutor · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminInstructorDetail instructorId={id} />;
}

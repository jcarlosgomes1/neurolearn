import { LearningPathsClient } from './LearningPathsClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function AdminLearningPathsPage() {
  return (
    <>
      <AdminPageHeader emoji="🗺️" title="Percursos de aprendizagem" description="Sequências curadas de cursos com prerequisites e progresso." />
      <LearningPathsClient />
    </>
  );
}

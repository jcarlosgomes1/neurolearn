import { LearningPathsClient } from './LearningPathsClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function AdminLearningPathsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="🗺️" title="Percursos de aprendizagem" description="Sequências curadas de cursos com prerequisites e progresso." />
      <LearningPathsClient />
    </div>
  );
}

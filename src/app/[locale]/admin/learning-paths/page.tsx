import { LearningPathsClient } from './LearningPathsClient';

export const dynamic = 'force-dynamic';

export default function AdminLearningPathsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Percursos de aprendizagem</h1>
        <p className="text-sm text-slate-500 mt-1">Sequências curadas de cursos com prerequisites e progresso.</p>
      </div>
      <LearningPathsClient />
    </div>
  );
}

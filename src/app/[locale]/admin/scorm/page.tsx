import { ScormAdmin } from './ScormAdmin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="📦" title="Pacotes SCORM" description="Importa conteúdos SCORM 1.2 / 2004 (normas LMS) para usar nos cursos." />
      <ScormAdmin />
    </div>
  );
}

import { PracticeAdmin } from './PracticeAdmin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="🧪" title="Exercícios práticos" description="Cria exercícios com avaliação automática configurável. Aprendizagem aplicada." />
      <PracticeAdmin />
    </>
  );
}

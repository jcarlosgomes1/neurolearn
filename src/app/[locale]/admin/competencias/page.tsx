import { SkillsAdmin } from './SkillsAdmin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="🎓" title="Competências" description="Catálogo de competências (ESCO + custom) e mapeamento a cursos. Validação por evidência." />
      <SkillsAdmin />
    </>
  );
}

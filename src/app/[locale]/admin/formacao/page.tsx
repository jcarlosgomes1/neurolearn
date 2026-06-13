import { FormacaoConsole } from './FormacaoConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="🎓" title="Formação" description="Decisões de instrutores, moderação de cursos, alunos em risco e geração de conteúdo." />
      <FormacaoConsole />
    </>
  );
}

import { ChallengesAdmin } from './ChallengesAdmin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="🏆" title="Desafios" description="Cria, edita e ativa desafios de gamificação (período, métrica, objetivo, recompensa). Tudo config-driven e multilíngue." />
      <ChallengesAdmin />
    </>
  );
}

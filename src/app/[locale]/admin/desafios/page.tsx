import { ChallengesAdmin } from './ChallengesAdmin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="🏆" title="Desafios" description="Cria, edita e ativa desafios de gamificação (período, métrica, objetivo, recompensa). Tudo config-driven e multilíngue." />
      <ChallengesAdmin />
    </div>
  );
}

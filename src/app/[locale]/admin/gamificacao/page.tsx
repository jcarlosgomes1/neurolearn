import { GamificationConfig } from './GamificationConfig';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="🎮" title="Gamificação" description="Calibra XP, pesos de reputação, níveis e faixas. Tudo configurável." />
      <GamificationConfig />
    </>
  );
}

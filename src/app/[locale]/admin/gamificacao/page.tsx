import { GamificationConfig } from './GamificationConfig';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="🎮" title="Gamificação" description="Calibra XP, pesos de reputação, níveis e faixas. Tudo configurável." />
      <GamificationConfig />
    </div>
  );
}

import { FunnelConsole } from './FunnelConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="🔻" title="Funil & Previsões" description="Estágios reais dos utilizadores, tendências e forecasting — atualizado automaticamente pelos agentes." />
      <FunnelConsole />
    </>
  );
}

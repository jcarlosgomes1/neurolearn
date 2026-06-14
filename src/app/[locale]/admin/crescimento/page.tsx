import { GrowthConsole } from './GrowthConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="📈" title="Crescimento" description="Acompanhamento event-driven: eventos, reações, recomendações e funil de monetização." />
      <GrowthConsole />
    </>
  );
}

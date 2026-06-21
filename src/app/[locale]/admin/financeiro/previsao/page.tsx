import { ForecastConsole } from './ForecastConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <>
      <AdminPageHeader
        emoji="🔮"
        title="Previsão"
        description="Procura (users e pagantes) e custos de serviços externos por área e por tenant, com ROI. Modelo config-driven, governado pelos agentes growth e receita."
      />
      <ForecastConsole />
    </>
  );
}

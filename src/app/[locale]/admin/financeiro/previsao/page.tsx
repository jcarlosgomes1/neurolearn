import { ForecastConsole } from './ForecastConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🔮"
        title="Previsão"
        description="Procura (users e pagantes) e custos de serviços externos por área e por tenant, com ROI. Modelo config-driven, governado pelos agentes growth e receita."
      />
      <ForecastConsole />
    </div>
  );
}

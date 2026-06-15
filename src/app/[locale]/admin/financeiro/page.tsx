import { FinanceConsole } from './FinanceConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <>
      <AdminPageHeader
        emoji="📊"
        title="Financeiro"
        description="Digital twin do negócio: projeção por canal, P&L (orçamento vs real vs outlook), runway e desvios detetados pelo agente."
      />
      <FinanceConsole locale={locale} />
    </>
  );
}

import { FinanceConsole } from './FinanceConsole';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="📊"
        title="Financeiro"
        description="Digital twin do negócio: projeção por canal, P&L (orçamento vs real vs outlook), runway e desvios detetados pelo agente."
      />
      <div className="mb-4">
        <a
          href={`/${locale}/admin/financeiro/previsao`}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:border-neutral-300"
        >
          🔮 Previsão de procura &amp; custos externos →
        </a>
      </div>
      <FinanceConsole locale={locale} />
    </div>
  );
}

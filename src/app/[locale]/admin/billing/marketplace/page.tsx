import { redirect } from 'next/navigation';
import { listMarketplaceSettingsAction } from '../actions';
import { MarketplaceSettings } from './MarketplaceSettings';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await listMarketplaceSettingsAction();
  if (!result.ok) redirect(`/${locale}/admin/billing`);
  return <MarketplaceSettings initial={(result.data as any[]) || []} />;
}

import { redirect } from 'next/navigation';
import { listAutopilotsAction } from './actions';
import { AutopilotsClient } from './AutopilotsClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await listAutopilotsAction();
  if (!result.ok || !result.data) {
    redirect(`/${locale}/admin`);
  }
  return <AutopilotsClient initial={result.data} />;
}

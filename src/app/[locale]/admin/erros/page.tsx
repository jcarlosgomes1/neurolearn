import { redirect } from 'next/navigation';
import { listErrorsAction } from './actions';
import { ErrorsClient } from './ErrorsClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await listErrorsAction(168);
  if (!result.ok) redirect(`/${locale}/admin`);
  return <ErrorsClient initialList={result.data?.list || []} initialSummary={result.data?.summary || []} />;
}

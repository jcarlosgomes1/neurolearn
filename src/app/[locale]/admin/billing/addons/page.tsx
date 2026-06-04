import { redirect } from 'next/navigation';
import { listAddonsAction } from '../actions';
import { AddonsEditor } from './AddonsEditor';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await listAddonsAction();
  if (!result.ok) redirect(`/${locale}/admin/billing`);
  return <AddonsEditor initial={(result.data as any[]) || []} />;
}

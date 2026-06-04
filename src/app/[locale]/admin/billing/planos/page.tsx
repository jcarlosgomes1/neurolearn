import { redirect } from 'next/navigation';
import { listPlansAction } from '../actions';
import { PlansEditor } from './PlansEditor';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await listPlansAction();
  if (!result.ok) redirect(`/${locale}/admin/billing`);
  return <PlansEditor initial={(result.data as any[]) || []} />;
}

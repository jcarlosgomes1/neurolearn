import { redirect } from 'next/navigation';
import { listProposalsAction } from './actions';
import { ProposalsList } from './ProposalsList';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const result = await listProposalsAction(slug);
  if (!result.ok) redirect(`/${locale}/empresa/${slug}`);
  return <ProposalsList slug={slug} initial={(result.data as any[]) || []} />;
}

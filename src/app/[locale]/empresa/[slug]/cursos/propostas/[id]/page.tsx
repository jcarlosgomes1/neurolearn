import { redirect } from 'next/navigation';
import { getProposalAction } from '../actions';
import { ProposalReview } from './ProposalReview';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string; id: string }> }) {
  const { locale, slug, id } = await params;
  const result = await getProposalAction(slug, id);
  if (!result.ok || !result.data) redirect(`/${locale}/empresa/${slug}/cursos/propostas`);
  return <ProposalReview slug={slug} initial={result.data as any} />;
}

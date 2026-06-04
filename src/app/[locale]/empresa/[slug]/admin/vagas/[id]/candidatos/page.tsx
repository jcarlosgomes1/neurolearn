import { redirect } from 'next/navigation';
import { getJobMatchAction } from '../../actions';
import { CandidatesClient } from './CandidatesClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string; id: string }> }) {
  const { locale, slug, id } = await params;
  const result = await getJobMatchAction(slug, id);
  if (!result.ok || !result.data) redirect(`/${locale}/empresa/${slug}/admin/vagas`);
  return <CandidatesClient slug={slug} initial={result.data as any} />;
}

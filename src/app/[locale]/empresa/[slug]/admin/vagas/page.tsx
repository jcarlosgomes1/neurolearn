import { redirect } from 'next/navigation';
import { listJobPostingsAction } from './actions';
import { JobPostingsClient } from './JobPostingsClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const result = await listJobPostingsAction(slug);
  if (!result.ok) redirect(`/${locale}/empresa/${slug}/admin`);
  return <JobPostingsClient slug={slug} initial={(result.data as any[]) || []} />;
}

import { redirect } from 'next/navigation';
import { getOrgAdminOverviewAction } from './actions';
import { OrgAdminClient } from './OrgAdminClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const result = await getOrgAdminOverviewAction(slug);
  if (!result.ok) redirect(`/${locale}/empresa/${slug}`);
  return <OrgAdminClient slug={slug} initial={result.data as any} />;
}

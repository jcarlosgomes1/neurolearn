import { redirect } from 'next/navigation';
import { listOrgScormAction } from './actions';
import { OrgScormClient } from './OrgScormClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const r = await listOrgScormAction(slug);
  if (!r.ok) redirect(`/${locale}/empresa/${slug}/admin`);
  return (
    <OrgScormClient
      slug={slug}
      orgId={r.orgId as string}
      initialPackages={(r.packages as never[]) || []}
      courses={(r.courses as never[]) || []}
    />
  );
}

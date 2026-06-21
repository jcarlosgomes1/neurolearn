import { OrgEventsClient } from './OrgEventsClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return <OrgEventsClient slug={slug} />;
}

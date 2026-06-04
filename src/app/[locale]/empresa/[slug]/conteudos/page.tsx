import { redirect } from 'next/navigation';
import { listOrgContentAction } from './actions';
import { ContentList } from './ContentList';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const result = await listOrgContentAction(slug);
  
  if (!result.ok || !result.data) {
    redirect(`/${locale}/empresa/${slug}`);
  }
  
  return (
    <ContentList 
      slug={slug}
      orgId={result.data.org_id}
      role={result.data.role}
      initial={result.data.content}
    />
  );
}

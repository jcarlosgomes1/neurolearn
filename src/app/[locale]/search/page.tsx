import { SemanticSearch } from './SemanticSearch';
import { SiteChrome } from '@/components/layout/SiteChrome';

export const metadata = { title: 'Pesquisa — NeuroLearn' };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  const { q } = await searchParams;
  return (
    <SiteChrome locale={locale} mainClassName="bg-white min-h-screen">
      <SemanticSearch initialQuery={q || ''} locale={locale} />
    </SiteChrome>
  );
}

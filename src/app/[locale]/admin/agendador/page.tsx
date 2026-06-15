import { AgendadorAdmin } from './AgendadorAdmin';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AgendadorAdmin locale={locale} />;
}

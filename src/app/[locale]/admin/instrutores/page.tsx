import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Absorvido pelo hub Pessoas (/admin/crm). Mantido só como redirect para não partir deep-links.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/admin/crm?tab=instrutores`);
}

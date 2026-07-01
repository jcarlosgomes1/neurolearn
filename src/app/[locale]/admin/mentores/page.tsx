import { redirect, RedirectType } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Absorvido pelo hub Pessoas (/admin/crm). Redirect com replace para nao prender o "voltar" do browser.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/admin/crm?tab=mentores`, RedirectType.replace);
}

import { redirect } from '@/i18n/routing';

// Página consolidada em /admin/integracoes (OAuth providers + secrets numa única UI)
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/admin/integracoes', locale });
  return null;
}

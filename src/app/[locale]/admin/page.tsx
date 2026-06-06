import { redirect } from '@/i18n/routing';

export const metadata = { title: 'Admin · Visão geral' };

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/admin/overview', locale });
}

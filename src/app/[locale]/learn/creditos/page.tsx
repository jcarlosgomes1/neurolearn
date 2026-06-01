import { redirect } from '@/i18n/routing';

// Credits system deferred until monetization phase.
// Page redirects to learning area.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/learn', locale });
}

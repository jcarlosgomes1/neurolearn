import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingClient } from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params, searchParams }: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string; cycle?: string }>;
}) {
  const { locale } = await params;
  const { plan, cycle } = await searchParams;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    const next = `/${locale}/business/onboarding${plan ? `?plan=${plan}` : ''}${cycle ? `&cycle=${cycle}` : ''}`;
    redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  }
  const { data: plans } = await sb.rpc('nl_billing_plans_public_list');
  return <OnboardingClient locale={locale} plans={(plans as any[]) || []} selectedPlanId={plan} selectedCycle={cycle || 'monthly'} userEmail={user.email || ''} />;
}

import { createClient } from '@/lib/supabase/server';
import { PricingClient } from './PricingClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  return { title: 'Preços · NeuroLearn' };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const [{ data: plans }, { data: addons }] = await Promise.all([
    sb.rpc('nl_billing_plans_public_list'),
    sb.rpc('nl_billing_addons_public_list'),
  ]);
  return <PricingClient locale={locale} plans={(plans as any[]) || []} addons={(addons as any[]) || []} />;
}

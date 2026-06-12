import { getTranslations } from 'next-intl/server';
import { PricingClient } from './PricingClient';

export async function generateMetadata() {
  const t = await getTranslations('teach.pricing');
  return { title: t('title') };
}

export default function Page() {
  return <PricingClient />;
}

import { ReviewsClient } from './ReviewsClient';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('teach.reviews.title') };
}

export default function Page() {
  return <ReviewsClient />;
}

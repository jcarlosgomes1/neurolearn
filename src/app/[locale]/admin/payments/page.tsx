import { PaymentsView } from './PaymentsView';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('admin_meta.payments') };
}

export default function Page() {
  return <PaymentsView />;
}

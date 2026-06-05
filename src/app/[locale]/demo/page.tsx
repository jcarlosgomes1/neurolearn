import { Link } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { DemoClient } from './DemoClient';

export const metadata = { 
  title: 'Demo · NeuroLearn',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <>
      <Header />
      <DemoClient />
    </>
  );
}

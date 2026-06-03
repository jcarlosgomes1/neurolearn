import { getTranslations } from 'next-intl/server';
import { LegalLayout } from '../(legal)/LegalLayout';

export const metadata = { title: 'Terms of Service' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  return (
    <LegalLayout locale={locale} title={t('legal.terms.title')} lastUpdated={t('legal.terms.last_updated')}>
      {[1,2,3,4,5,6,7,8,9].map((i) => (
        <section key={i}>
          <h2>{t(`legal.terms.s${i}_title` as any)}</h2>
          <p>{t(`legal.terms.s${i}_body` as any)}</p>
        </section>
      ))}
    </LegalLayout>
  );
}

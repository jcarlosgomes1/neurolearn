import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { redirect } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { getTranslations } from 'next-intl/server';
import { CreateOrgForm } from './CreateOrgForm';
import { COUNTRIES } from '@/lib/utils/countries';

export const metadata = { title: 'Create workspace' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login?next=/empresa/criar' as any, locale });
  const t = await getTranslations();

  // Map Country (with name_pt/name_en) into the shape CreateOrgForm expects ({ code, name })
  const countries = COUNTRIES.map((c) => ({
    code: c.code,
    name: locale === 'pt' ? c.name_pt : c.name_en,
  }));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <AppPageHeader title={t('emp.create.title')} description={t('emp.create.subtitle')} emoji="🏢" />
          <div className="mt-8">
            <CreateOrgForm countries={countries} locale={locale} />
          </div>
        </div>
      </main>
    </>
  );
}

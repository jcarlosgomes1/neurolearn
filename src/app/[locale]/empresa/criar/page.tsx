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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('emp.create.title')}</h1>
          <p className="mt-2 text-slate-600">{t('emp.create.subtitle')}</p>
          <div className="mt-8">
            <CreateOrgForm countries={COUNTRIES} locale={locale} />
          </div>
        </div>
      </main>
    </>
  );
}

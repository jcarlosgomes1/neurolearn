import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { LoginForm } from './LoginForm';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('login.meta_title') };
}

export default async function LoginPage() {
  const t = await getTranslations();
  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="text-center mb-6">
              <span className="text-4xl">🧠</span>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">{t('login.title')}</h1>
              <p className="text-sm text-slate-500 mt-1">{t('login.subtitle')}</p>
            </div>
            <LoginForm />
            <p className="text-center text-sm text-slate-500 mt-6">
              {t('login.no_account')}{' '}
              <Link href={'/register' as any} className="text-brand-600 hover:underline font-medium">
                {t('login.signup_free')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

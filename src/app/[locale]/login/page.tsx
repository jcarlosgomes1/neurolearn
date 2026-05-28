import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="text-center mb-6">
              <span className="text-4xl">\u{1F9E0}</span>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">Entrar</h1>
              <p className="text-sm text-slate-500 mt-1">Acede \u00e0 tua \u00e1rea NeuroLearn</p>
            </div>
            <LoginForm />
            <p className="text-center text-sm text-slate-500 mt-6">
              Ainda n\u00e3o tens conta?{' '}
              <Link href={'/register' as any} className="text-brand-600 hover:underline font-medium">
                Regista-te gr\u00e1tis
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { RegisterForm } from './RegisterForm';

export const metadata = { title: 'Criar conta' };

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="text-center mb-6">
              <span className="text-4xl">\u{1F9E0}</span>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">Criar conta</h1>
              <p className="text-sm text-slate-500 mt-1">Come\u00e7a a aprender em 30 segundos</p>
            </div>
            <RegisterForm />
            <p className="text-center text-sm text-slate-500 mt-6">
              J\u00e1 tens conta?{' '}
              <Link href={'/login' as any} className="text-brand-600 hover:underline font-medium">
                Entra aqui
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

import { Link } from '@/i18n/routing';
import { AIFeaturesList } from './AIFeaturesList';

export const metadata = { title: 'AI Features dos Instrutores · Admin' };

export default function Page() {
  return (
    <>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
          <div className="mt-2 mb-6 flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🤖 AI Features dos Instrutores</h1>
              <p className="text-sm text-slate-500 mt-1">Activa funcionalidades AI para cada instrutor aprovado. Por defeito, ninguém tem acesso.</p>
            </div>
          </div>
          <AIFeaturesList />
        </div>
      
    </>
  );
}

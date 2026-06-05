import { Link } from '@/i18n/routing';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-7xl sm:text-9xl font-black bg-gradient-to-br from-brand-600 to-violet-600 bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-4">Página não encontrada</h1>
        <p className="text-sm text-slate-500 mt-2">
          A página que procuras não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-6 justify-center">
          <Link href={`/` as any}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm">
            <Home className="h-4 w-4" /> Página inicial
          </Link>
          <Link href={`/catalogo` as any}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm">
            <Search className="h-4 w-4" /> Catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from '@/i18n/routing';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white mb-4 shadow-lg">
          <Compass className="h-8 w-8" />
        </div>
        <div className="text-6xl font-bold text-slate-200 mb-1">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Página não encontrada</h1>
        <p className="text-sm text-slate-600 mb-6">Esta página foi movida ou nunca existiu. Tenta procurar abaixo ou volta à home.</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link href={'/' as any} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg">
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link href={'/cursos' as any} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">
            <Search className="h-4 w-4" /> Ver cursos
          </Link>
        </div>
        <p className="text-[11px] text-slate-400 mt-6">Sugestão: pressiona <kbd className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">⌘K</kbd> para procurar.</p>
      </div>
    </div>
  );
}

import { Link } from '@/i18n/routing';
import { getSessionWithArea } from '@/lib/supabase/server';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';

export async function Header() {
  const session = await getSessionWithArea();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 group">
          <span className="text-2xl transition-transform group-hover:scale-110">🧠</span>
          <span className="text-lg tracking-tight">NeuroLearn</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href={'/cursos' as any} className="btn-ghost">Cursos</Link>
          <Link href={'/essentials' as any} className="btn-ghost">Essentials</Link>
          <Link href={'/empresas' as any} className="btn-ghost">Empresas</Link>
          <Link href={'/blog' as any} className="btn-ghost">Blog</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href={'/search' as any} aria-label="Pesquisar" className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          </Link>
          <LanguageSwitcher />
          {session ? (
            <UserMenu email={session.user.email!} area={session.area} />
          ) : (
            <Link href={'/login' as any} className="btn-primary text-sm py-2 px-4">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

import { Link } from '@/i18n/routing';

interface FooterData {
  brand?: string;
}

export function Footer({ data }: { data: FooterData }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-bold text-white text-lg">
              <span>🧠</span>
              <span>NeuroLearn</span>
            </div>
            {data?.brand && (
              <p className="mt-3 text-sm max-w-md leading-relaxed">{data.brand}</p>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Plataforma</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={'/cursos' as any} className="hover:text-white transition-colors">Cursos</Link></li>
              <li><Link href={'/essentials' as any} className="hover:text-white transition-colors">Essentials</Link></li>
              <li><Link href={'/empresas' as any} className="hover:text-white transition-colors">Empresas</Link></li>
              <li><Link href={'/blog' as any} className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={'/termos' as any} className="hover:text-white transition-colors">Termos</Link></li>
              <li><Link href={'/privacidade' as any} className="hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link href={'/cookies' as any} className="hover:text-white transition-colors">Cookies</Link></li>
              <li><Link href={'/contacto' as any} className="hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs">
          © {year} NeuroLearn. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

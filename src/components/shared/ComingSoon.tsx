import { Link } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';

interface Props {
  emoji: string;
  title: string;
  description: string;
  features?: string[];
}

export function ComingSoon({ emoji, title, description, features }: Props) {
  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-brand-50/50 via-white to-slate-50 p-4">
        <div className="text-center max-w-2xl animate-fade-in">
          <div className="text-7xl mb-6">{emoji}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
            {title}
          </h1>
          <p className="mt-4 text-lg text-slate-600 text-pretty leading-relaxed">{description}</p>

          {features && features.length > 0 && (
            <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 text-left">
              <p className="text-sm font-semibold text-slate-900 mb-3">A construir agora:</p>
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-brand-500 mt-0.5">\u25B8</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-secondary">\u2190 Voltar \u00e0 p\u00e1gina inicial</Link>
            <Link href={'/cursos' as any} className="btn-primary">Ver cursos</Link>
          </div>
        </div>
      </main>
    </>
  );
}

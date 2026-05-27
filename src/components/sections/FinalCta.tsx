import { Link } from '@/i18n/routing';

interface CtaData {
  title: string;
  sub?: string;
  btn1?: string;
  btn2?: string;
  note?: string;
}

export function FinalCta({ data }: { data: CtaData }) {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-16 sm:px-12 sm:py-20 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
              {data.title}
            </h2>
            {data.sub && (
              <p className="mt-4 text-lg text-brand-100 max-w-2xl mx-auto text-pretty">
                {data.sub}
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={'/register' as any}
                className="bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors shadow-lg"
              >
                {data.btn1 || 'Começar grátis'}
              </Link>
              <Link
                href={'/cursos' as any}
                className="border border-white/40 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                {data.btn2 || 'Ver cursos'}
              </Link>
            </div>
            {data.note && (
              <p className="mt-6 text-sm text-brand-200">{data.note}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

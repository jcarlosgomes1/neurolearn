import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Check, X, ArrowRight, Sparkles, GitCompare } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Comparar plataformas · NeuroLearn' }; }

interface Row { feature: string; nl: string | boolean; udemy: string | boolean; coursera: string | boolean; teachable: string | boolean; }

const ROWS: Row[] = [
  { feature: 'Cursos em PT/EN/ES/FR', nl: true, udemy: 'Limitado', coursera: 'Limitado', teachable: 'Limitado' },
  { feature: 'Tutor personalizado 24/7', nl: true, udemy: false, coursera: false, teachable: false },
  { feature: 'Percursos curados', nl: true, udemy: false, coursera: 'Pago', teachable: false },
  { feature: 'Marketplace talento integrado', nl: true, udemy: false, coursera: false, teachable: false },
  { feature: 'B2B White-label', nl: true, udemy: 'Business', coursera: 'Business', teachable: 'Pago' },
  { feature: 'Geração cursos a partir docs', nl: true, udemy: false, coursera: false, teachable: false },
  { feature: 'Free tier sem limite tempo', nl: true, udemy: 'Trial', coursera: 'Trial', teachable: false },
  { feature: 'Certificados verificáveis', nl: true, udemy: true, coursera: true, teachable: true },
  { feature: 'Comunidade Discord integrada', nl: true, udemy: false, coursera: false, teachable: false },
  { feature: 'Eventos mensais grátis', nl: true, udemy: false, coursera: false, teachable: false },
  { feature: 'Suporte cliente em PT', nl: true, udemy: false, coursera: false, teachable: false },
];

function render(v: string | boolean) {
  if (v === true) return <Check className="h-5 w-5 text-emerald-600 mx-auto" />;
  if (v === false) return <X className="h-5 w-5 text-slate-300 mx-auto" />;
  return <span className="text-xs text-slate-600">{v}</span>;
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-xs font-semibold text-emerald-700 mb-6 shadow-sm">
              <GitCompare className="h-3.5 w-3.5" /> Comparativo
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Compara <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">honestamente</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Sem cherry-picking. Sem letra pequena. NeuroLearn lado-a-lado com as principais plataformas de cursos online.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-200">
                  <th className="text-left p-4 font-bold text-slate-700">Característica</th>
                  <th className="p-4 font-bold bg-gradient-to-br from-emerald-600 to-blue-600 bg-clip-text text-transparent">NeuroLearn</th>
                  <th className="p-4 font-bold text-slate-500">Udemy</th>
                  <th className="p-4 font-bold text-slate-500">Coursera</th>
                  <th className="p-4 font-bold text-slate-500">Teachable</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-semibold text-slate-900">{r.feature}</td>
                    <td className="p-4 text-center bg-emerald-50/30">{render(r.nl)}</td>
                    <td className="p-4 text-center">{render(r.udemy)}</td>
                    <td className="p-4 text-center">{render(r.coursera)}</td>
                    <td className="p-4 text-center">{render(r.teachable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">Última actualização: Junho 2026. Baseado em planos públicos comparáveis.</p>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-blue-600 p-10 shadow-2xl text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-70" />
            <h2 className="text-2xl sm:text-3xl font-bold">Experimenta sem compromisso</h2>
            <p className="mt-3 text-white/90 max-w-xl mx-auto">Não acreditas? Cria conta grátis e compara a experiência de aprendizagem por ti mesmo.</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-white text-emerald-700 hover:bg-emerald-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
              Criar conta grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
  );
}

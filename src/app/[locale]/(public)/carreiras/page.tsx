import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Briefcase, Heart, Zap, Globe2, Coffee, ArrowRight, Code, Palette, BarChart3, Users } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Carreiras · NeuroLearn' }; }

const VALUES = [
  { icon: Zap, title: 'Velocidade > perfeição', desc: 'Lançamos, medimos, iteramos. Nada está terminado — está sempre a evoluir.', cls: 'from-amber-500 to-orange-600' },
  { icon: Heart, title: 'Cuidamos do produto', desc: 'Pensamos em quem usa. Cada decisão começa numa pergunta: e o utilizador?', cls: 'from-rose-500 to-pink-600' },
  { icon: Globe2, title: 'Remoto por design', desc: 'Trabalha onde te focas melhor. Equipa global, processos assíncronos.', cls: 'from-emerald-500 to-teal-600' },
  { icon: Coffee, title: 'Calma e ambição', desc: 'Sem cultura de presença. Resultados, não horas. Férias generosas. Sustentável.', cls: 'from-violet-500 to-indigo-600' },
];

const ROLES = [
  { icon: Code, title: 'Engineering', area: 'Backend, Frontend, ML', level: 'Mid · Senior', cls: 'from-violet-500 to-indigo-600' },
  { icon: Palette, title: 'Design', area: 'Product Design, UX Research', level: 'Mid', cls: 'from-fuchsia-500 to-pink-600' },
  { icon: BarChart3, title: 'Growth', area: 'Performance, Content, SEO', level: 'Mid · Senior', cls: 'from-amber-500 to-orange-600' },
  { icon: Users, title: 'Customer Success', area: 'B2B Enterprise, B2C', level: 'Junior · Mid', cls: 'from-emerald-500 to-teal-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-rose-400/20 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-rose-200 text-xs font-semibold text-rose-700 mb-6 shadow-sm">
              <Briefcase className="h-3.5 w-3.5" /> Estamos a contratar
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Constrói o futuro da <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">aprendizagem</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Equipa pequena, impacto grande. Construímos a plataforma que queríamos ter tido quando começámos as nossas próprias carreiras.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-12">Como trabalhamos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUES.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${v.cls} text-white items-center justify-center mb-3 shadow-md`}>
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{v.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-3">Vagas abertas</h2>
            <p className="text-center text-slate-600 mb-12">Mesmo que não vejas a tua área, envia candidatura espontânea — adoramos surpresas.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {ROLES.map((r, i) => (
                <Link key={i}
                  href={{ pathname: '/contacto', query: { topic: 'careers', subject: `Candidatura · ${r.title}`, from: '/carreiras' } } as any}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-4">
                  <div className={`flex-shrink-0 inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${r.cls} text-white items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <r.icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900">{r.title}</div>
                    <div className="text-sm text-slate-600">{r.area}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.level} · Remoto</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href={{ pathname: '/contacto', query: { topic: 'careers', subject: 'Candidatura espontânea', from: '/carreiras' } } as any}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-rose-600 to-pink-600 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                Enviar candidatura espontânea <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
  );
}

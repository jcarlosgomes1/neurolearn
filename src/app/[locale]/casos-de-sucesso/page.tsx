import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Trophy, Quote, TrendingUp, Briefcase, GraduationCap, Building2, ArrowRight, Sparkles } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Casos de sucesso · NeuroLearn' }; }

interface Case { name: string; role: string; company: string; quote: string; outcome: string; outcomeLabel: string; icon: any; cls: string; }

const CASES: Case[] = [
  {
    name: 'Ricardo F.', role: 'Software Engineer', company: 'Anteriormente: vendas · Lisboa',
    quote: 'Em seis meses passei de comercial sem código a desenvolvedor júnior numa scale-up. A diferença foi o foco em projectos reais — tinha portfolio para mostrar em entrevista.',
    outcome: '+€18k/ano', outcomeLabel: 'Aumento salarial',
    icon: Briefcase, cls: 'from-violet-500 to-indigo-600',
  },
  {
    name: 'Ana M.', role: 'UX Designer Senior', company: 'Promovida de Junior em 9 meses',
    quote: 'Já trabalhava em design mas estava estagnada. Os percursos guiados deram-me a estrutura que faltava — design systems, research, accessibility. Promoção saiu naturalmente.',
    outcome: 'Senior', outcomeLabel: 'Promoção em 9 meses',
    icon: TrendingUp, cls: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Marta C.', role: 'Talent Manager', company: 'Sistema Hospitalar · Porto',
    quote: 'Subimos os nossos manuais de procedimentos e a plataforma gerou cursos personalizados para 340 enfermeiros. Compliance e formação contínua resolvidos sem contratar formadores externos.',
    outcome: '340 colaboradores', outcomeLabel: 'Formados em 3 meses',
    icon: Building2, cls: 'from-amber-500 to-orange-600',
  },
  {
    name: 'João T.', role: 'Data Analyst', company: 'Recém-licenciado · Coimbra',
    quote: 'Acabei o curso de gestão sem saber Python ou SQL. Em 4 meses completei o percurso completo de análise de dados e fui contratado via marketplace de talento da própria NeuroLearn.',
    outcome: '1º emprego', outcomeLabel: 'Contratado via marketplace',
    icon: GraduationCap, cls: 'from-rose-500 to-pink-600',
  },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/3 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/3 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-xs font-semibold text-emerald-700 mb-6 shadow-sm">
              <Trophy className="h-3.5 w-3.5" /> Casos de sucesso
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Histórias reais de <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">transformação</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Não vendemos cursos — vendemos resultados. Conhece pessoas e empresas que mudaram a vida com a plataforma.
            </p>
          </div>
        </section>

        {/* Cases */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-6">
          {CASES.map((c, i) => (
            <article key={i} className="group bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden relative">
              <div className={`absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br ${c.cls} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
              <div className="relative grid sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2 space-y-4">
                  <Quote className={`h-8 w-8 bg-gradient-to-br ${c.cls} text-white p-1.5 rounded-lg`} />
                  <blockquote className="text-lg sm:text-xl text-slate-800 leading-relaxed italic">
                    "{c.quote}"
                  </blockquote>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-sm text-slate-600">{c.role}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.company}</div>
                  </div>
                </div>
                <div className="sm:border-l sm:border-slate-100 sm:pl-6 flex flex-col justify-center items-center sm:items-start">
                  <div className={`inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-3 shadow-lg`}>
                    <c.icon className="h-7 w-7" />
                  </div>
                  <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-br ${c.cls} bg-clip-text text-transparent`}>
                    {c.outcome}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">{c.outcomeLabel}</div>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-10 sm:p-14 shadow-2xl text-center text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-70" />
            <h2 className="text-3xl sm:text-4xl font-bold">A tua história pode ser a próxima</h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">Começa hoje. Sem cartão de crédito. Acesso imediato a quatro idiomas e centenas de cursos.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                Explorar cursos <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl backdrop-blur-sm">
                Criar conta grátis
              </Link>
            </div>
          </div>
        </section>

        <Footer data={(blocks as any).footer_brand || { brand: 'NeuroLearn' }} />
      </main>
    </>
  );
}

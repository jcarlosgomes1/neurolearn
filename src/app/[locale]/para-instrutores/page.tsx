import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { GraduationCap, DollarSign, Globe2, Sparkles, Users, BarChart3, ArrowRight, Check, X, Briefcase } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Para instrutores · NeuroLearn' }; }

const STATS = [
  { value: '70%', label: 'da receita para ti' },
  { value: '4', label: 'idiomas de tradução automática' },
  { value: '€0', label: 'sem fees de upload' },
  { value: '24h', label: 'pagamentos imediatos' },
];

const FEATURES = [
  { icon: DollarSign, title: 'Revshare 70%', desc: 'Ganha mais que em qualquer outra plataforma. Pagamentos diários via Stripe.', cls: 'from-emerald-500 to-teal-600' },
  { icon: Globe2, title: 'Tradução automática', desc: 'Carrega em português. A plataforma traduz para EN/ES/FR mantendo o teu tom de voz.', cls: 'from-violet-500 to-indigo-600' },
  { icon: Sparkles, title: 'Geração assistida', desc: 'Sobe o teu material e a plataforma estrutura módulos, exercícios e quizzes — tu refinas.', cls: 'from-fuchsia-500 to-pink-600' },
  { icon: BarChart3, title: 'Analytics em tempo real', desc: 'Vê quem está a estudar, onde desistem, que perguntas fazem. Itera com dados.', cls: 'from-amber-500 to-orange-600' },
  { icon: Briefcase, title: 'Talent marketplace', desc: 'Os teus alunos certificados aparecem em vagas — recebes royalties cada vez que um é contratado.', cls: 'from-rose-500 to-red-600' },
  { icon: Users, title: 'Marketing partilhado', desc: 'A plataforma promove o teu curso. Tu focas em ensinar, não em vender.', cls: 'from-blue-500 to-cyan-600' },
];

const COMPARE = [
  { feature: 'Revshare', neuro: '70%', udemy: '37–97%', coursera: '50%', teachable: '90% (paga taxa fixa)' },
  { feature: 'Tradução incluída', neuro: 'Sim · 4 idiomas', udemy: 'Não', coursera: 'Limitada', teachable: 'Não' },
  { feature: 'Geração assistida cursos', neuro: 'Sim', udemy: 'Não', coursera: 'Não', teachable: 'Não' },
  { feature: 'Talent marketplace', neuro: 'Sim · royalties', udemy: 'Não', coursera: 'Não', teachable: 'Não' },
  { feature: 'Sem fees fixos', neuro: 'Sim', udemy: 'Sim', coursera: 'Sim', teachable: 'Não (mensal)' },
  { feature: 'Pagamentos', neuro: '24h', udemy: '30 dias', coursera: '60 dias', teachable: '30 dias' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-amber-700 mb-6 shadow-sm">
              <GraduationCap className="h-3.5 w-3.5" /> Para instrutores
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Ensina o que sabes. <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Multiplica o teu impacto.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Plataforma feita para instrutores que querem viver disto. Revshare a sério, tradução incluída, e zero esforço com marketing ou infraestrutura.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={'/candidatar' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-amber-600 to-orange-600 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                Candidatar-me <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent">{s.value}</div>
                  <div className="text-xs text-slate-600 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Tudo o que precisas para ganhar a vida ensinando</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${f.cls} text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compare */}
        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Comparação directa</h2>
              <p className="mt-3 text-slate-600">Sem letra pequena. Compara as principais plataformas de cursos online.</p>
            </div>
            <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200">
                    <th className="text-left p-4 font-bold text-slate-700">Característica</th>
                    <th className="p-4 font-bold bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent">NeuroLearn</th>
                    <th className="p-4 font-bold text-slate-500">Udemy</th>
                    <th className="p-4 font-bold text-slate-500">Coursera</th>
                    <th className="p-4 font-bold text-slate-500">Teachable</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-4 font-semibold text-slate-900">{r.feature}</td>
                      <td className="p-4 text-center font-bold text-amber-700 bg-amber-50/30">{r.neuro}</td>
                      <td className="p-4 text-center text-slate-600">{r.udemy}</td>
                      <td className="p-4 text-center text-slate-600">{r.coursera}</td>
                      <td className="p-4 text-center text-slate-600">{r.teachable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 p-10 sm:p-14 shadow-2xl text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold">Pronto a candidatar-te?</h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">Revisamos cada candidatura em 48h. Sem fee de aplicação. Sem compromisso até publicares o primeiro curso.</p>
            <Link href={'/candidatar' as any} className="inline-flex items-center gap-2 px-8 py-3.5 mt-8 bg-white text-orange-700 hover:bg-orange-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg text-base">
              Candidatar como instrutor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <Footer data={(blocks as any).footer_brand || { brand: 'NeuroLearn' }} />
      </main>
    </>
  );
}

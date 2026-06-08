import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Sparkles, Globe2, Heart, Zap, Target, Users2, Award, ArrowRight, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Sobre · NeuroLearn', description: 'A nossa missão: democratizar o acesso à aprendizagem profissional de qualidade.' };

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.3),transparent_50%)]" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}} />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold mb-6">
              <Sparkles className="h-3 w-3 text-amber-300" /> A nossa história
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
              A aprendizagem que <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">transforma carreiras</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
              Nasceu da convicção que o talento está em todo o lado mas as oportunidades não. Construímos a plataforma que muda isso.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 sm:py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                { icon: Target, title: 'Missão', text: 'Tornar a aprendizagem profissional acessível, prática e ligada a empregos reais.', grad: 'from-violet-500 to-fuchsia-600' },
                { icon: Globe2, title: 'Visão', text: 'Um mundo onde qualquer pessoa, em qualquer lugar, pode aprender e ser contratada pela competência demonstrada.', grad: 'from-emerald-500 to-teal-600' },
                { icon: Heart, title: 'Valores', text: 'Honestidade radical, qualidade sem compromisso, e respeito por quem aprende e quem ensina.', grad: 'from-amber-500 to-orange-600' },
              ].map((v) => (
                <div key={v.title} className="relative bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl transition-all">
                  <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${v.grad} text-white items-center justify-center mb-4 shadow-lg`}>
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-3">A nossa história</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-8">Construído por quem aprende, para quem aprende</h2>
            <div className="prose prose-slate max-w-none space-y-5 text-base text-slate-700 leading-relaxed">
              <p>Começou com uma frustração simples: por que é que aprender online é tão impessoal, tão genérico, tão desligado do mercado de trabalho?</p>
              <p>Vimos pessoas a investir centenas de horas em cursos que nunca lhes abriram uma porta. Vimos empresas a desperdiçar orçamentos em formações que ninguém termina. Vimos instrutores brilhantes que mereciam alcançar milhões mas estavam presos a plataformas que ficam com 70% do que ganham.</p>
              <p>Decidimos construir algo diferente. Uma plataforma onde a aprendizagem é prática, onde a certificação é verificável, onde os instrutores ficam com a maior parte do que ganham, e onde o passo seguinte — o trabalho real — está sempre à distância de um clique.</p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-slate-950 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { value: '15k+', label: 'Alunos activos', icon: Users2 },
                { value: '500+', label: 'Cursos disponíveis', icon: Award },
                { value: '95%', label: 'Taxa de conclusão', icon: TrendingUp },
                { value: '4.8/5', label: 'Satisfação média', icon: Sparkles },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <s.icon className="h-6 w-6 text-violet-400 mx-auto mb-2" />
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{s.value}</div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Zap className="h-12 w-12 mx-auto mb-5 text-amber-300" />
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">Junta-te a quem está a moldar o futuro</h2>
            <p className="text-lg text-violet-100 mb-8 max-w-xl mx-auto">Aprende, ensina ou recruta — começa hoje em menos de 60 segundos.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={'/register' as any} className="inline-flex items-center gap-1.5 px-6 py-3 bg-white text-violet-700 font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
                Criar conta grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={'/cursos' as any} className="inline-flex items-center gap-1.5 px-6 py-3 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all">
                Explorar catálogo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Brain, Heart, Globe, Zap, Users, Target, Award, ArrowRight, Sparkles } from 'lucide-react';

export const revalidate = 3600;
export const metadata = { title: 'Sobre nós · NeuroLearn', description: 'Quem somos, missão e valores da NeuroLearn.' };

export default async function SobrePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 py-20 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.15),transparent_50%)]" />
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur border border-violet-200 rounded-full text-xs font-semibold text-violet-700 mb-5">
              <Sparkles className="h-3 w-3" /> A nossa história
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight">
              Educação que <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">transforma carreiras</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Nascemos da convicção de que aprender deve ser intuitivo, prático e acessível. Construímos uma plataforma onde qualquer pessoa pode dominar tecnologias avançadas — no seu ritmo, na sua língua.
            </p>
          </div>
        </section>

        {/* Missão / Visão / Valores */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Missão', text: 'Democratizar o acesso a educação de topo em tecnologias do futuro, com conteúdo prático e mensurável.', cls: 'from-violet-500 to-indigo-600' },
              { icon: Heart, title: 'Valores', text: 'Honestidade, rigor científico, respeito pelo tempo do aluno, comunidade acima de tudo.', cls: 'from-rose-500 to-pink-600' },
              { icon: Globe, title: 'Visão', text: 'Ser a referência global em formação contínua para o profissional moderno — em 4 línguas, em qualquer dispositivo.', cls: 'from-emerald-500 to-teal-600' },
            ].map((it, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${it.cls} text-white items-center justify-center shadow-lg mb-4`}>
                  <it.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{it.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{it.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-12">Como começámos</h2>
            <div className="space-y-6 text-slate-700 leading-relaxed text-lg">
              <p>Em 2024 nasceu uma frustração: cursos online superficiais, traduções automáticas pobres, certificados sem credibilidade. Os profissionais lusófonos mereciam mais.</p>
              <p>Começámos com 1 curso, 50 alunos e uma promessa: <strong className="text-violet-700">conteúdo de topo, em português real, com aplicação imediata no trabalho</strong>. Hoje somos uma equipa internacional com 12.000+ alunos em 30+ países.</p>
              <p>Cada curso é revisto trimestralmente. Cada feedback é analisado. Cada aluno é tratado como pessoa, não número. Esta é a NeuroLearn.</p>
            </div>
          </div>
        </section>

        {/* Números */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '12k+', label: 'Alunos activos', cls: 'from-violet-600 to-indigo-600' },
              { value: '30+', label: 'Países', cls: 'from-emerald-600 to-teal-600' },
              { value: '4.8★', label: 'Avaliação média', cls: 'from-amber-500 to-orange-600' },
              { value: '97%', label: 'Concluem o curso', cls: 'from-fuchsia-600 to-pink-600' },
            ].map((s, i) => (
              <div key={i}>
                <div className={`text-5xl sm:text-6xl font-black bg-gradient-to-br ${s.cls} bg-clip-text text-transparent`}>{s.value}</div>
                <div className="text-sm text-slate-600 mt-2 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-3xl p-10 sm:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Junta-te a milhares de profissionais</h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">Começa hoje, sem cartão, sem compromisso.</p>
              <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-700 hover:bg-slate-100 text-base font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                Explorar cursos <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

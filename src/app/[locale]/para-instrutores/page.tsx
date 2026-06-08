import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Sparkles, DollarSign, Users2, Zap, BarChart3, Globe2, Headphones, ArrowRight, Check, X, GraduationCap, Award } from 'lucide-react';

export const metadata = { title: 'Para Instrutores · NeuroLearn', description: 'Ensina o que sabes. Fica com 70% do que ganhas. Construído por instrutores, para instrutores.' };

const FEATURES = [
  { icon: DollarSign, title: '70% da receita para ti', text: 'A maior taxa do mercado. Sem fees escondidas, sem letra pequena.', grad: 'from-emerald-500 to-teal-600' },
  { icon: Sparkles, title: 'Ferramentas que poupam horas', text: 'Editor de cursos com módulos, lições e quizzes. Vídeo hosting incluído.', grad: 'from-violet-500 to-fuchsia-600' },
  { icon: BarChart3, title: 'Analytics em tempo real', text: 'Sabes exactamente o que funciona — taxas de conclusão, dúvidas frequentes, pontos de abandono.', grad: 'from-blue-500 to-cyan-600' },
  { icon: Globe2, title: 'Audiência internacional', text: 'Mais de 30 países. Suporte multilíngua nativo.', grad: 'from-amber-500 to-orange-600' },
  { icon: Users2, title: 'Comunidade activa', text: 'Q&A integrada, reviews verificadas, alunos engajados.', grad: 'from-fuchsia-500 to-pink-600' },
  { icon: Headphones, title: 'Suporte humano', text: 'Equipa dedicada. Não nos escondemos atrás de chatbots.', grad: 'from-rose-500 to-red-600' },
];

const COMPARE = [
  { name: 'NeuroLearn', revshare: '70%', features: ['Vídeo Mux incluído', 'Tutor para alunos', 'Talent marketplace', 'Sem taxa marketing'], highlight: true },
  { name: 'Udemy', revshare: '37-97%', features: ['Vídeo limitado', 'Sem tutor', 'Sem talent', 'Cobra 50% em marketing'] },
  { name: 'Coursera', revshare: '50%', features: ['Vídeo incluído', 'Sem tutor', 'Sem talent', 'Mercado fechado'] },
  { name: 'Teachable', revshare: '90%', features: ['Vídeo extra', 'Sem tutor', 'Sem talent', 'Tu trazes audiência'] },
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.3),transparent_50%)]" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}} />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur border border-amber-400/30 text-xs font-semibold mb-6">
                <GraduationCap className="h-3 w-3 text-amber-300" /> Programa de instrutores
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
                Ensina o que sabes.<br /><span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Fica com 70%.</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-lg">Construído por instrutores, para instrutores. A plataforma que não te trata como mercadoria.</p>
              <div className="flex flex-wrap gap-3">
                <Link href={'/candidatar' as any} className="inline-flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
                  Candidatar agora <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#compare" className="inline-flex items-center gap-1.5 px-6 py-3 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all">
                  Comparar plataformas
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{v:'70%',l:'Comissão'},{v:'<30d',l:'Approval médio'},{v:'15k',l:'Alunos activos'},{v:'4.8★',l:'Rating instrutores'}].map((s) => (
                <div key={s.l} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">{s.v}</div>
                  <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Tudo o que precisas</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Ferramentas para construir, vender e escalar</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 transition-all">
                  <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${f.grad} text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="compare" className="py-20 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Comparação</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Como ganham os instrutores noutras plataformas</h2>
              <p className="text-sm text-slate-500 mt-2">A taxa real depois de fees, marketing e descontos.</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
              {COMPARE.map((p, i) => (
                <div key={p.name} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6 ${p.highlight ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500' : 'border-b border-slate-100 last:border-0'}`}>
                  <div className="sm:w-32 flex-shrink-0">
                    <div className={`font-bold ${p.highlight ? 'text-amber-700' : 'text-slate-800'}`}>{p.name}</div>
                    {p.highlight && <Award className="h-4 w-4 text-amber-500 mt-0.5" />}
                  </div>
                  <div className={`sm:w-24 text-2xl font-bold flex-shrink-0 ${p.highlight ? 'text-amber-600' : 'text-slate-500'}`}>{p.revshare}</div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {p.features.map((feat, idx) => (
                      <span key={idx} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${p.highlight ? 'bg-emerald-100 text-emerald-700' : idx > 0 ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-600'}`}>
                        {p.highlight || idx === 0 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {feat}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Zap className="h-12 w-12 mx-auto mb-5" />
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">A tua candidatura demora 5 minutos</h2>
            <p className="text-lg text-amber-50 mb-8 max-w-xl mx-auto">Apresenta uma proposta de curso. Resposta em menos de 30 dias.</p>
            <Link href={'/candidatar' as any} className="inline-flex items-center gap-1.5 px-7 py-3 bg-white text-orange-600 font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
              Candidatar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

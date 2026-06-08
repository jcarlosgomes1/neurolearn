import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Briefcase, Heart, Zap, Globe2, Coffee, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

export const metadata = { title: 'Carreiras · NeuroLearn', description: 'Junta-te à equipa que está a redesenhar a aprendizagem profissional.' };

const VALUES = [
  { icon: Zap, title: 'Velocidade > perfeição', text: 'Enviamos cedo, aprendemos rápido, melhoramos constantemente.' },
  { icon: Heart, title: 'Honestidade radical', text: 'Discordamos abertamente. Decidimos depois. Comprometemo-nos sempre.' },
  { icon: Globe2, title: 'Remote-first', text: 'Trabalhamos de onde funcionar melhor para nós. Encontramos 2x por ano.' },
  { icon: Coffee, title: 'Foco profundo', text: 'Sem reuniões inúteis. Quartas-feiras sem meetings. Horas de make tempo sagrado.' },
];

const PERKS = [
  'Salário acima do mercado · revisão semestral',
  'Equity para todos os colaboradores',
  '40 dias de férias por ano',
  'Orçamento anual €3000 para formação',
  'Material de trabalho topo de gama',
  'Encontros físicos 2x/ano em cidade europeia',
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-rose-950 via-pink-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.25),transparent_60%)]" />
          <div className="absolute top-20 left-1/3 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 backdrop-blur border border-rose-400/30 text-xs font-semibold mb-6">
              <Briefcase className="h-3 w-3 text-rose-300" /> Estamos a contratar
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
              Constrói o futuro <span className="bg-gradient-to-r from-rose-300 to-pink-300 bg-clip-text text-transparent">da aprendizagem profissional</span> connosco
            </h1>
            <p className="text-lg text-slate-300 max-w-xl">Equipa pequena, missão grande. Sem hierarquias absurdas, sem reuniões a mais.</p>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Como trabalhamos</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Quatro princípios que guiam todas as decisões</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {VALUES.map(v => (
                <div key={v.title} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl transition-all">
                  <v.icon className="h-8 w-8 text-rose-600 mb-3" />
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-3xl p-8 sm:p-10">
              <div className="text-center mb-8">
                <Sparkles className="h-8 w-8 text-rose-600 mx-auto mb-3" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">O que oferecemos</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {PERKS.map(p => (
                  <div key={p} className="flex items-center gap-3 bg-white/60 backdrop-blur rounded-xl p-3">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
                    <span className="text-sm text-slate-700">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-950 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-5 text-rose-400" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">Vagas abertas</h2>
            <p className="text-slate-300 mb-8">Não temos vagas abertas neste momento — mas adoramos receber candidaturas espontâneas de pessoas excepcionais.</p>
            <a href="mailto:carreiras@neurolearn.com" className="inline-flex items-center gap-1.5 px-7 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
              Candidatura espontânea <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

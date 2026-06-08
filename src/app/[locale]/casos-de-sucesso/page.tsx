import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Quote, TrendingUp, Clock, Euro, Briefcase, ArrowRight, Star } from 'lucide-react';

export const revalidate = 3600;
export const metadata = { title: 'Casos de sucesso · NeuroLearn', description: 'Histórias reais de quem transformou a carreira com a NeuroLearn.' };

const CASES = [
  {
    name: 'Ricardo Mendes', role: 'Director de Operações', company: 'LogiPort', avatar: 'RM',
    industry: 'Logística', course: 'Fundamentos de IA + Prompt Engineering',
    headline: 'Automatizei contratos que demoravam dias — ROI positivo na primeira semana.',
    body: 'Em 3 meses construí um workflow de geração e revisão de contratos B2B usando GPT-4 + nossos templates. O que demorava 2 dias de jurista passou a 20 minutos. Hoje processamos 4× mais contratos com a mesma equipa.',
    metrics: [{ label: 'Tempo poupado', value: '85%', icon: Clock }, { label: 'ROI', value: '12×', icon: Euro }, { label: 'Contratos/mês', value: '300+', icon: TrendingUp }],
    cls: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Ana Sousa', role: 'AI Engineer', company: 'Remoto · Berlin', avatar: 'AS',
    industry: 'Tech / Startup', course: 'Agentes LangChain + Computer Vision',
    headline: 'O curso de agentes mudou a minha carreira. 3 ofertas durante a formação.',
    body: 'Vinha de backend Python. Em 4 meses construí um portfolio de 3 agentes funcionais (research, customer support, code review). Comecei a aplicar em LinkedIn e recebi 3 ofertas em 6 semanas — escolhi a melhor com aumento de 40%.',
    metrics: [{ label: 'Aumento salarial', value: '+40%', icon: Euro }, { label: 'Ofertas recebidas', value: '3', icon: Briefcase }, { label: 'Tempo', value: '4 meses', icon: Clock }],
    cls: 'from-violet-500 to-indigo-600',
  },
  {
    name: 'Marta Pereira', role: 'Directora de Marketing', company: 'GreenMobility PT', avatar: 'MP',
    industry: 'Mobilidade / E-commerce', course: 'Excel com IA + IA para Negócios',
    headline: 'Automatizei relatórios mensais — poupei 12 horas por semana.',
    body: 'A minha equipa passava 3 dias por mês a compilar relatórios manualmente. Aprendi a usar Python + GPT no Excel para extrair, limpar e visualizar dados. Reportes ficam prontos em 1 hora. Reinvesti o tempo em campanhas — leads cresceram 60% no trimestre.',
    metrics: [{ label: 'Horas/semana poupadas', value: '12h', icon: Clock }, { label: 'Crescimento leads', value: '+60%', icon: TrendingUp }, { label: 'Custo formação', value: '€29/mês', icon: Euro }],
    cls: 'from-amber-500 to-orange-600',
  },
  {
    name: 'João Silva', role: 'Product Manager', company: 'Banco Fintech', avatar: 'JS',
    industry: 'Banca / Fintech', course: 'NLP e Texto + Fundamentos IA',
    headline: 'Comecei do zero. Hoje lidero a estratégia de IA do produto.',
    body: 'Nunca tinha programado. Em 6 meses dominei prompt engineering, RAG e fine-tuning leve. Liderei a implementação de um assistente de suporte que reduziu tickets em 38%. Fui promovido a Senior PM com responsabilidade direta sobre IA.',
    metrics: [{ label: 'Redução tickets', value: '-38%', icon: TrendingUp }, { label: 'Promoção', value: 'Senior PM', icon: Briefcase }, { label: 'Background', value: 'Zero código', icon: Star }],
    cls: 'from-rose-500 to-pink-600',
  },
];

export default async function CasosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-20 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_55%)]" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 mb-5">
              <Star className="h-3 w-3" /> Histórias reais · resultados reais
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight">
              Como os nossos alunos <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">transformaram</span> as suas carreiras
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Casos detalhados, métricas verificáveis, sem fluff.</p>
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-12">
            {CASES.map((c, i) => (
              <article key={i} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
                <div className={`bg-gradient-to-br ${c.cls} p-1`}>
                  <div className="bg-white rounded-[calc(1.5rem-4px)] p-6 sm:p-10">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${c.cls} text-white flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0`}>{c.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-sm text-slate-600">{c.role} · {c.company}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{c.industry} · {c.course}</div>
                      </div>
                      <Quote className="h-8 w-8 text-slate-200 flex-shrink-0" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 leading-tight">{c.headline}</h3>
                    <p className="text-slate-700 leading-relaxed mb-6">{c.body}</p>
                    <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100">
                      {c.metrics.map((m, mi) => (
                        <div key={mi} className="text-center">
                          <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-1.5`}>
                            <m.icon className="h-4 w-4" />
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-slate-900">{m.value}</div>
                          <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-10 sm:p-14 text-center text-white shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">A próxima história pode ser a tua</h2>
            <p className="text-lg text-white/90 mb-8">Começa hoje. Cancela quando quiseres.</p>
            <Link href={'/precos' as any} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 hover:bg-slate-100 text-base font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
              Ver planos <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Quote, TrendingUp, Briefcase, GraduationCap, Building2, ArrowRight, Star, Award } from 'lucide-react';

export const metadata = { title: 'Casos de sucesso · NeuroLearn', description: 'Histórias reais de quem transformou a carreira com a NeuroLearn.' };

const CASES = [
  { name: 'Ricardo M.', role: 'Data Engineer · Banco BPI', from: 'Recepcionista de hotel', quote: 'Em 8 meses passei de zero conhecimento técnico a engenheiro contratado pelo banco. O que mudou foi a estrutura.', metric: '€38k/ano', metricLabel: 'Salário actual', course: 'Engenharia de Dados', grad: 'from-violet-500 to-fuchsia-600', icon: Briefcase },
  { name: 'Ana S.', role: 'Product Designer · freelance', from: 'Designer interna mal paga', quote: 'O percurso UX deu-me não só competências mas certificação que clientes internacionais valorizam. Triplicei a tarifa.', metric: '€85/h', metricLabel: 'Tarifa actual', course: 'UX Design Profissional', grad: 'from-emerald-500 to-teal-600', icon: GraduationCap },
  { name: 'Marta L.', role: 'Head of L&D · Sonae', from: 'Gestora de RH a precisar de upskill', quote: 'Pusemos 240 colaboradores em formação contínua. O ROI veio em 6 meses via retenção e produtividade.', metric: '240', metricLabel: 'Funcionários activos', course: 'B2B Corporate LMS', grad: 'from-amber-500 to-orange-600', icon: Building2 },
  { name: 'João P.', role: 'Backend Developer · Feedzai', from: 'Estudante de matemática', quote: 'Os exercícios são reais, não brinquedos. Cheguei ao primeiro emprego com portfólio que outros candidatos não tinham.', metric: '3 ofertas', metricLabel: 'Em 2 semanas', course: 'Backend Profissional', grad: 'from-blue-500 to-cyan-600', icon: Award },
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.25),transparent_50%)]" />
          <div className="absolute top-32 right-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold mb-6">
              <Star className="h-3 w-3 text-amber-300" /> Histórias reais
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
              Quatro pessoas. Quatro <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">trajectórias diferentes</span>. Um mesmo ponto de viragem.
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">A próxima podes ser tu.</p>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            {CASES.map((c, i) => (
              <article key={c.name} className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''} lg:flex`}>
                <div className={`bg-gradient-to-br ${c.grad} p-8 sm:p-10 text-white lg:w-2/5 flex flex-col justify-between`}>
                  <div>
                    <c.icon className="h-10 w-10 mb-4 opacity-90" />
                    <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Caso #{i + 1}</div>
                    <div className="text-2xl font-bold mb-1">{c.name}</div>
                    <div className="text-sm opacity-90">{c.role}</div>
                    <div className="text-xs opacity-70 mt-2 italic">Antes: {c.from}</div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/20">
                    <div className="text-4xl font-bold">{c.metric}</div>
                    <div className="text-xs uppercase tracking-wider opacity-80 mt-1">{c.metricLabel}</div>
                  </div>
                </div>
                <div className="p-8 sm:p-10 lg:w-3/5">
                  <Quote className="h-8 w-8 text-slate-300 mb-3" />
                  <p className="text-lg sm:text-xl text-slate-800 leading-relaxed mb-6 italic">{c.quote}</p>
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Percurso</div>
                      <div className="text-sm font-semibold text-slate-700">{c.course}</div>
                    </div>
                    <Link href={'/cursos' as any} className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900">
                      Ver percursos similares <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-950 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-5 text-emerald-400" />
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">A tua história começa hoje</h2>
            <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">Não são milagres — é método, prática e oportunidades certas. Vê os cursos e escolhe o teu próximo passo.</p>
            <Link href={'/cursos' as any} className="inline-flex items-center gap-1.5 px-7 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
              Explorar catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

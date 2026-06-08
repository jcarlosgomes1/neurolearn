import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { BookOpen, FileText, Mic, Video, Download, ArrowRight, Sparkles, Mail } from 'lucide-react';

export const metadata = { title: 'Recursos gratuitos · NeuroLearn', description: 'Ebooks, templates, webinars e podcast. Tudo grátis, sem subscrições.' };

const CATEGORIES = [
  { icon: BookOpen, name: 'Ebooks', count: 24, color: 'violet', grad: 'from-violet-500 to-fuchsia-600',
    items: ['Guia carreira em Tech 2026', 'Português para tech: glossário', 'Como passar uma entrevista técnica'] },
  { icon: FileText, name: 'Templates', count: 47, color: 'emerald', grad: 'from-emerald-500 to-teal-600',
    items: ['CV profissional Tech', 'Carta de motivação', 'Plano de estudo 90 dias'] },
  { icon: Video, name: 'Webinars', count: 18, color: 'amber', grad: 'from-amber-500 to-orange-600',
    items: ['Reskilling em 2026', 'IA generativa para profissionais', 'Negociar salário em tech'] },
  { icon: Mic, name: 'Podcast NeuroLab', count: 62, color: 'rose', grad: 'from-rose-500 to-pink-600',
    items: ['Ep.62: Mudar de carreira aos 40', 'Ep.61: Backend é dead?', 'Ep.60: Remote first'] },
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.25),transparent_60%)]" />
          <div className="absolute top-20 right-1/3 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/20 backdrop-blur border border-fuchsia-400/30 text-xs font-semibold mb-6">
              <Sparkles className="h-3 w-3 text-fuchsia-300" /> Tudo grátis · Sem subscrições
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Recursos para quem quer <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">crescer profissionalmente</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">Ebooks, templates, webinars e o nosso podcast NeuroLab. Sem custo, sem letra pequena.</p>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {CATEGORIES.map((c) => (
                <div key={c.name} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all">
                  <div className={`bg-gradient-to-br ${c.grad} p-5 text-white`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <c.icon className="h-9 w-9 mb-3 opacity-90" />
                        <h3 className="text-2xl font-bold">{c.name}</h3>
                        <div className="text-xs opacity-80 mt-1">{c.count} recursos</div>
                      </div>
                      <ArrowRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    {c.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-700 py-1.5 hover:text-violet-700 cursor-pointer">
                        <Download className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {item}
                      </div>
                    ))}
                    <div className="pt-3 border-t border-slate-100 mt-3">
                      <span className="text-xs font-semibold text-slate-500 group-hover:text-violet-700">Ver todos os {c.count} →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <Mail className="h-12 w-12 mx-auto mb-5 text-fuchsia-200" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Newsletter semanal</h2>
            <p className="text-violet-100 mb-7">Um email por semana. 5 min de leitura. Tendências, ferramentas e oportunidades.</p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input type="email" placeholder="o-teu-email@exemplo.com"
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur border border-white/30 placeholder-violet-200 text-white rounded-xl outline-none focus:bg-white/20" />
              <button className="px-6 py-3 bg-white text-violet-700 font-semibold rounded-xl shadow-lg hover:scale-105 transition-transform">
                Subscrever
              </button>
            </div>
            <p className="text-xs text-violet-200 mt-3">Sem spam. Cancela a qualquer momento.</p>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

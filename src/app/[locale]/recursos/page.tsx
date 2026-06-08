import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Book, Video, FileText, Mic, Wrench, Sparkles, Download, ArrowRight, Calendar, Users } from 'lucide-react';

export const revalidate = 3600;
export const metadata = { title: 'Recursos grátis · NeuroLearn', description: 'Ebooks, templates, webinars e ferramentas grátis para aprender IA.' };

const CATEGORIES = [
  { icon: Book, title: 'Ebooks', count: 8, cls: 'from-violet-500 to-indigo-600', items: [
    { title: 'Guia prático de Prompt Engineering', pages: 32, format: 'PDF' },
    { title: 'IA generativa para gestores: o essencial', pages: 24, format: 'PDF' },
    { title: 'Glossário de IA em português', pages: 18, format: 'PDF' },
  ]},
  { icon: Wrench, title: 'Templates & Tools', count: 12, cls: 'from-emerald-500 to-teal-600', items: [
    { title: 'Excel: 50 fórmulas para combinar com GPT', pages: '.xlsx', format: 'Excel' },
    { title: 'Prompt library: 100 prompts testados', pages: '.json', format: 'JSON' },
    { title: 'Calculadora de ROI de automação IA', pages: '.xlsx', format: 'Excel' },
  ]},
  { icon: Video, title: 'Webinars on-demand', count: 6, cls: 'from-rose-500 to-pink-600', items: [
    { title: 'Como construir o teu primeiro agente em 1h', pages: '60min', format: 'Vídeo' },
    { title: 'Fine-tuning sem código com OpenAI', pages: '45min', format: 'Vídeo' },
    { title: 'Casos reais de empresas portuguesas', pages: '90min', format: 'Vídeo' },
  ]},
  { icon: Mic, title: 'Podcast NeuroLab', count: 24, cls: 'from-amber-500 to-orange-600', items: [
    { title: 'Ep24: O futuro do trabalho com IA', pages: '52min', format: 'Áudio' },
    { title: 'Ep23: Como o ChatGPT mudou a saúde', pages: '47min', format: 'Áudio' },
    { title: 'Ep22: Construir uma startup de IA em PT', pages: '61min', format: 'Áudio' },
  ]},
];

export default async function RecursosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-20 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),transparent_55%)]" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 mb-5">
              <Download className="h-3 w-3" /> 100% gratuitos
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight">
              Recursos para <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">aprender e aplicar</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Ebooks, templates, webinars e ferramentas. Sem cartão. Sem newsletter obrigatória.</p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            {CATEGORIES.map((cat, ci) => (
              <div key={ci}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${cat.cls} text-white flex items-center justify-center shadow-lg`}>
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{cat.title}</h2>
                    <div className="text-xs text-slate-500">{cat.count} recursos disponíveis</div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {cat.items.map((it, ii) => (
                    <div key={ii} className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{it.format}</span>
                        <Download className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2 leading-snug">{it.title}</h3>
                      <div className="text-xs text-slate-500">{it.pages}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter signup */}
        <section className="py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center shadow-sm">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white items-center justify-center shadow-lg mb-5">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Recebe novos recursos primeiro</h2>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto">Newsletter semanal: 1 recurso novo + 1 caso real + 1 tutorial prático. Sem spam.</p>
            <form className="flex flex-wrap gap-2 max-w-md mx-auto">
              <input type="email" placeholder="O teu email" className="flex-1 min-w-[200px] px-4 py-3 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
              <button type="button" className="px-6 py-3 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm">Subscrever</button>
            </form>
            <p className="text-[10px] text-slate-400 mt-3">Podes cancelar a qualquer momento. Não partilhamos o teu email.</p>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

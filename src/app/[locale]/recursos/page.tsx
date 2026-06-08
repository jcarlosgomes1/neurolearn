import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { BookOpen, FileText, Video, Mic, Download, ArrowRight, Sparkles } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Recursos · NeuroLearn' }; }

const CATEGORIES = [
  { icon: BookOpen, title: 'Ebooks', count: '12 disponíveis', desc: 'Guias práticos de transição de carreira, prompts para tutor, técnicas de aprendizagem activa.', cls: 'from-violet-500 to-indigo-600' },
  { icon: FileText, title: 'Templates', count: '24 disponíveis', desc: 'CVs por área, cartas de motivação, planos de estudo trimestrais, briefings de projecto.', cls: 'from-emerald-500 to-teal-600' },
  { icon: Video, title: 'Webinars', count: '8 gravados', desc: 'Conversas com tech leads, designers, founders, gestores de talento — todos a partilhar a sério.', cls: 'from-amber-500 to-orange-600' },
  { icon: Mic, title: 'NeuroLab Podcast', count: 'Semanal', desc: 'Conversas curtas sobre aprendizagem, carreira tech e futuro do trabalho. Spotify · Apple · YouTube.', cls: 'from-fuchsia-500 to-pink-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-pink-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-fuchsia-200 text-xs font-semibold text-fuchsia-700 mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Recursos gratuitos
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Aprende mesmo sem <span className="bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">comprar nada</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Centenas de horas de conteúdo gratuito: ebooks, templates, webinars e podcast. Sem subscrição, sem upsell agressivo.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid sm:grid-cols-2 gap-6">
            {CATEGORIES.map((c, i) => (
              <div key={i} className="group bg-white rounded-3xl border border-slate-200 p-8 hover:-translate-y-1 hover:shadow-2xl transition-all relative overflow-hidden">
                <div className={`absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br ${c.cls} opacity-5 blur-3xl group-hover:opacity-15 transition-opacity`} />
                <div className={`inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <c.icon className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-xl text-slate-900">{c.title}</h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{c.count}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{c.desc}</p>
                <Link href={'/blog' as any} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:gap-2 transition-all">
                  Explorar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center text-white">
            <Download className="h-8 w-8 mx-auto mb-3 opacity-70" />
            <h2 className="text-2xl sm:text-3xl font-bold">Newsletter mensal</h2>
            <p className="mt-3 text-white/80">Curadoria do melhor conteúdo do mês + ebook gratuito para subscritores novos. Cancela com 1 clique.</p>
            <form className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input type="email" placeholder="o-teu-email@exemplo.com" className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/50" />
              <button type="submit" className="px-6 py-3 bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:scale-105 transition-all text-white font-bold rounded-xl shadow-lg">Subscrever</button>
            </form>
          </div>
        </section>

        <Footer data={(blocks as any).footer_brand || { brand: 'NeuroLearn' }} />
      </main>
    </>
  );
}

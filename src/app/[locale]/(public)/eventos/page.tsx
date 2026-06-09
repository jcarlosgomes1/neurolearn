import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Calendar, Video, Users, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Eventos & Webinars · NeuroLearn' }; }

interface Event { date: string; time: string; type: string; title: string; speaker: string; mode: string; cls: string; }

const UPCOMING: Event[] = [
  { date: '2026-06-20', time: '18:00 CET', type: 'Webinar', title: 'IA aplicada: o que mudou em 2026 para developers', speaker: 'Marina Costa · Staff Engineer', mode: 'Online · Grátis', cls: 'from-violet-500 to-indigo-600' },
  { date: '2026-06-27', time: '14:00 CET', type: 'AMA', title: 'AMA com fundadores: 18 meses depois de lançar', speaker: 'Equipa NeuroLearn', mode: 'Discord · Live', cls: 'from-emerald-500 to-teal-600' },
  { date: '2026-07-04', time: '10:00 CET', type: 'Workshop', title: 'Portfolio Review: feedback ao vivo aos teus projectos', speaker: 'Painel de Tech Leads', mode: 'Online · Limit 50', cls: 'from-amber-500 to-orange-600' },
  { date: '2026-07-15', time: 'Todo o dia', type: 'Hackathon', title: 'NeuroHack #03 — 24h para construir algo útil', speaker: 'Comunidade NeuroLearn', mode: 'Híbrido · Lisboa+Online', cls: 'from-fuchsia-500 to-pink-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-200 text-xs font-semibold text-indigo-700 mb-6 shadow-sm">
              <Calendar className="h-3.5 w-3.5" /> Eventos
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Aprender em <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">directo</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Webinars, AMAs, workshops e hackathons mensais. Todos gratuitos para utilizadores registados.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Próximos eventos</h2>
          <div className="space-y-4">
            {UPCOMING.map((e, i) => (
              <article key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className={`flex-shrink-0 inline-flex flex-col items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br ${e.cls} text-white shadow-lg`}>
                    <div className="text-2xl font-bold">{new Date(e.date).getDate()}</div>
                    <div className="text-[10px] uppercase font-bold opacity-80">{new Date(e.date).toLocaleDateString('pt-PT', { month: 'short' })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-gradient-to-br ${e.cls} text-white`}>{e.type}</span>
                      <span className="text-xs text-slate-500 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time}</span>
                      <span className="text-xs text-slate-500 inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.mode}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{e.title}</h3>
                    <div className="text-sm text-slate-600 inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {e.speaker}</div>
                  </div>
                  <button className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    Inscrever <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-t border-slate-200/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Video className="h-10 w-10 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Perdeste algum?</h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">Todos os webinars ficam gravados e disponíveis na biblioteca de utilizadores registados — gratuito para sempre.</p>
            <Link href={'/recursos' as any} className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-gradient-to-br from-indigo-600 to-violet-600 hover:scale-105 transition-all text-white font-bold rounded-xl shadow-lg">
              Biblioteca de gravações <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
  );
}

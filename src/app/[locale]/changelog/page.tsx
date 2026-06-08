import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Rocket, Sparkles, Zap, Bug, Plus, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Changelog · NeuroLearn', description: 'O que mudou, o que melhorámos, o que está a caminho.' };

const RELEASES = [
  { date: 'Jun 2026', version: 'v2.6', items: [
    { type: 'new', text: 'Multi-tenant feature configuration por empresa' },
    { type: 'new', text: 'Programa de afiliados completo com tracking' },
    { type: 'new', text: 'Landing pages customizáveis por curso' },
    { type: 'improve', text: 'i18n DB-driven: edita textos sem deploy' },
  ]},
  { date: 'Mai 2026', version: 'v2.5', items: [
    { type: 'new', text: 'Sistema de agendamento nativo (alternativa Cal.com)' },
    { type: 'new', text: 'Vídeo rooms via Daily.co integrados' },
    { type: 'new', text: 'Sync bidireccional com Google Calendar' },
    { type: 'fix', text: 'Reschedule de bookings (até 3x)' },
  ]},
  { date: 'Abr 2026', version: 'v2.4', items: [
    { type: 'new', text: 'Talent marketplace · matching certificados-empresas' },
    { type: 'new', text: 'B2B corporate LMS multi-tenant' },
    { type: 'improve', text: 'Upload de PDFs/vídeos e geração automática de cursos' },
  ]},
  { date: 'Mar 2026', version: 'v2.3', items: [
    { type: 'new', text: 'Tutor disponível 24/7 em todas as lições' },
    { type: 'new', text: 'Quiz player com correcção instantânea' },
    { type: 'new', text: 'Certificados verificáveis com QR code' },
  ]},
];

const TYPE_META: Record<string, { label: string; cls: string; icon: any }> = {
  new:     { label: 'NOVO',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Plus },
  improve: { label: 'MELHORIA', cls: 'bg-blue-100 text-blue-700 border-blue-200', icon: Sparkles },
  fix:     { label: 'FIX',      cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Bug },
};

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.2),transparent_60%)]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
            <Rocket className="h-12 w-12 mx-auto mb-5 text-violet-400" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">Changelog</h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">Todas as melhorias, novas funcionalidades e correcções — em transparência total.</p>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
            {RELEASES.map(r => (
              <article key={r.version} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white items-center justify-center font-bold text-xs">
                      {r.version.replace('v','')}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{r.version}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">{r.date}</div>
                    </div>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {r.items.map((item, i) => {
                    const meta = TYPE_META[item.type];
                    const Icon = meta.icon;
                    return (
                      <li key={i} className="flex items-start gap-3 px-6 py-3">
                        <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 ${meta.cls}`}>
                          <Icon className="h-2.5 w-2.5" /> {meta.label}
                        </span>
                        <span className="text-sm text-slate-700 leading-relaxed">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <Zap className="h-10 w-10 mx-auto mb-4 text-violet-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Tens uma sugestão?</h2>
            <p className="text-sm text-slate-600 mb-6">Construímos a plataforma com a comunidade. Diz-nos o que falta.</p>
            <a href="mailto:roadmap@neurolearn.com" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl">
              Enviar sugestão <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

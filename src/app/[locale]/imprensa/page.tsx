import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Newspaper, Download, Mail, ArrowRight, Award, Calendar, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Imprensa · NeuroLearn', description: 'Recursos para jornalistas: press kit, factos, contactos.' };

const FACTS = [
  { label: 'Fundada em', value: '2025' },
  { label: 'Alunos activos', value: '15.000+' },
  { label: 'Instrutores certificados', value: '180+' },
  { label: 'Empresas clientes', value: '47' },
  { label: 'Países servidos', value: '32' },
  { label: 'Cursos publicados', value: '500+' },
];

const COVERAGE = [
  { outlet: 'Observador', date: 'Mar 2026', title: 'A plataforma portuguesa que dá 70% aos instrutores' },
  { outlet: 'ECO', date: 'Fev 2026', title: 'Ensino digital ganha tração no segmento B2B corporate' },
  { outlet: 'Eco Insider', date: 'Jan 2026', title: 'Solo founder constrói LMS multi-tenant para 47 empresas' },
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.2),transparent_60%)]" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
            <Newspaper className="h-12 w-12 mx-auto mb-5 text-indigo-400" />
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">Sala de imprensa</h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">Recursos para jornalistas, analistas e parceiros editoriais.</p>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">A NeuroLearn em números</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Factos rápidos</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {FACTS.map(f => (
                <div key={f.label} className="bg-white border border-slate-200 rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{f.value}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-6">
                <Download className="h-8 w-8 text-violet-600 mb-3" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Press kit completo</h3>
                <p className="text-sm text-slate-600 mb-5">Logos (SVG+PNG), fotos da equipa, screenshots da plataforma, biografias.</p>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg">
                  <Download className="h-3.5 w-3.5" /> Descarregar .zip (24MB)
                </button>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                <Mail className="h-8 w-8 text-amber-600 mb-3" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Pedidos de imprensa</h3>
                <p className="text-sm text-slate-600 mb-5">Entrevistas, comentários, dados anuais. Resposta em 24h úteis.</p>
                <a href="mailto:imprensa@neurolearn.com" className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg">
                  imprensa@neurolearn.com <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <Award className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Cobertura recente</h2>
            </div>
            <div className="space-y-3">
              {COVERAGE.map((c, i) => (
                <article key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-bold text-indigo-600">{c.outlet}</span>
                      <span>·</span>
                      <span>{c.date}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800">{c.title}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

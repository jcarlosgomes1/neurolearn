import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Handshake, Building2, Users, Zap, Globe2, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Parceiros · NeuroLearn', description: 'Constrói connosco. Programas para integradores, agências e empresas.' };

const TYPES = [
  { icon: Building2, title: 'Reseller', desc: 'Revende NeuroLearn aos teus clientes. Margem 25% + co-branding.', perks: ['25% margem recorrente', 'Co-branded landing', 'Suporte dedicado'], grad: 'from-violet-500 to-fuchsia-600' },
  { icon: Zap, title: 'Tecnológico', desc: 'Integra com a tua plataforma via API ou MCP. Caso de uso: HRIS, ATS, CRM.', perks: ['API pública gratuita', 'Listagem no marketplace', 'Suporte de engenharia'], grad: 'from-emerald-500 to-teal-600' },
  { icon: Users, title: 'Agência de talento', desc: 'Encaminha alunos certificados. Recebes comissão de placement.', perks: ['Comissão por contratação', 'Dashboard candidatos', 'Pipeline integrado'], grad: 'from-amber-500 to-orange-600' },
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3),transparent_50%)]" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur border border-emerald-400/30 text-xs font-semibold mb-6">
              <Handshake className="h-3 w-3 text-emerald-300" /> Programa de parceiros
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Constrói connosco. <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Cresce connosco.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">3 programas com comissões reais, integração técnica simples e suporte humano.</p>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {TYPES.map(t => (
                <div key={t.title} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all">
                  <div className={`bg-gradient-to-br ${t.grad} p-6 text-white`}>
                    <t.icon className="h-9 w-9 mb-3 opacity-90" />
                    <h3 className="text-2xl font-bold mb-2">{t.title}</h3>
                    <p className="text-sm opacity-90">{t.desc}</p>
                  </div>
                  <div className="p-6 space-y-2.5">
                    {t.perks.map(p => (
                      <div key={p} className="flex items-center gap-2 text-sm text-slate-700">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> {p}
                      </div>
                    ))}
                    <button className="w-full mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors">
                      Candidatar <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Globe2 className="h-12 w-12 mx-auto mb-5" />
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">Vamos conversar</h2>
            <p className="text-lg text-emerald-50 mb-8 max-w-xl mx-auto">Escreve-nos com o teu caso de uso. Resposta em 48h úteis.</p>
            <a href="mailto:parceiros@neurolearn.com" className="inline-flex items-center gap-1.5 px-7 py-3 bg-white text-emerald-700 font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
              parceiros@neurolearn.com <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

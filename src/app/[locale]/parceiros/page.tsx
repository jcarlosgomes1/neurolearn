import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Handshake, Building2, GraduationCap, Briefcase, Globe2, ArrowRight, Sparkles, Check } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Parceiros · NeuroLearn' }; }

const TYPES = [
  { icon: Building2, title: 'Reseller / Integrador', desc: 'Vende a NeuroLearn aos teus clientes B2B. 30% revshare nos 12 primeiros meses.', perks: ['Comissões recorrentes', 'Formação técnica gratuita', 'Marca co-marketing', 'Lead routing'], cls: 'from-violet-500 to-indigo-600' },
  { icon: GraduationCap, title: 'Instituição de ensino', desc: 'Complementa o teu curriculum com cursos práticos certificados. Bolsas para estudantes.', perks: ['Acesso a 200+ cursos', 'Validação académica', 'Programa de bolsas', 'Workshops conjuntos'], cls: 'from-emerald-500 to-teal-600' },
  { icon: Briefcase, title: 'Recrutador / Headhunter', desc: 'Aceita certificações NeuroLearn como pré-validação. Acesso preferencial ao marketplace.', perks: ['Pipeline qualificado', 'Filtros por skills', 'API integração ATS', 'Suporte dedicado'], cls: 'from-amber-500 to-orange-600' },
  { icon: Globe2, title: 'Provider de conteúdo', desc: 'Tens cursos premium? Co-distribuição e visibilidade na maior comunidade lusófona.', perks: ['Revshare 60/40', 'Tradução incluída', 'Promoção editorial', 'White-label opcional'], cls: 'from-fuchsia-500 to-pink-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-teal-200 text-xs font-semibold text-teal-700 mb-6 shadow-sm">
              <Handshake className="h-3.5 w-3.5" /> Programa de parceiros
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Cresçamos <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">juntos</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Quatro programas distintos consoante o teu modelo. Termos transparentes, suporte real, e impacto medido pelos teus resultados.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-6">
          {TYPES.map((t, i) => (
            <div key={i} className="group bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="grid sm:grid-cols-5 gap-6 items-center">
                <div className="sm:col-span-1 flex sm:block items-center gap-3">
                  <div className={`inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br ${t.cls} text-white items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <t.icon className="h-8 w-8" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <h3 className={`text-xl font-bold bg-gradient-to-r ${t.cls} bg-clip-text text-transparent mb-2`}>{t.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{t.desc}</p>
                </div>
                <div className="sm:col-span-2 grid grid-cols-2 gap-1.5">
                  {t.perks.map((p, pi) => (
                    <div key={pi} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" /> {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-600 p-10 shadow-2xl text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-70" />
            <h2 className="text-2xl sm:text-3xl font-bold">Pronto a falar?</h2>
            <p className="mt-3 text-white/90">Marca uma chamada de 30min. Sem compromisso, sem pitch comercial.</p>
            <a href="mailto:partners@neurolearn.pt?subject=Parceria" className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-white text-teal-700 hover:bg-teal-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
              partners@neurolearn.pt <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <Footer data={(blocks as any).footer_brand || { brand: 'NeuroLearn' }} />
      </main>
    </>
  );
}

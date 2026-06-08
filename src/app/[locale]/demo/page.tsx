import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Play, Sparkles, Check, ArrowRight, Calendar, Video, Building2 } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Demo · NeuroLearn' }; }

const COVERED = [
  'Tour completo da plataforma B2C, B2B e talent marketplace',
  'Como funciona a geração de cursos a partir dos vossos documentos',
  'Personalização white-label: domínio, branding, paleta',
  'Integração com SSO (Google, Microsoft, SAML) e SCIM',
  'Modelos de pricing e plano que melhor se adequa',
  'Casos de uso reais por sector (healthcare, fintech, retail, consultoria)',
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-violet-200 text-xs font-semibold text-violet-700 mb-6 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Demo personalizada
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                  Vê a plataforma <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">em acção</span>
                </h1>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  30 minutos com a nossa equipa. Foco no teu caso de uso real. Sem demo pré-gravada, sem slides intermináveis.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="mailto:demo@neurolearn.pt?subject=Demo" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                    <Calendar className="h-4 w-4" /> Marcar demo
                  </a>
                  <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all font-bold rounded-xl shadow-sm">
                    <Play className="h-4 w-4" /> Tour por mim mesmo
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-3xl bg-gradient-to-br from-slate-900 to-violet-900 shadow-2xl flex items-center justify-center group cursor-pointer hover:shadow-violet-500/20 transition-shadow">
                  <div className="h-20 w-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="h-9 w-9 text-violet-700 ml-1" fill="currentColor" />
                  </div>
                  <div className="absolute bottom-4 left-4 text-white text-sm font-semibold">Tour interactivo (2min)</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">O que cobrimos na demo</h2>
            <p className="mt-3 text-slate-600">Personalizada às tuas necessidades — não um deck genérico.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {COVERED.map((c, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-violet-200 transition-all">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                </div>
                <span className="text-sm text-slate-700 leading-relaxed">{c}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-t border-slate-200/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Building2 className="h-10 w-10 text-violet-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Não és uma empresa?</h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">Não precisas de demo. Cria conta grátis e começa a explorar imediatamente.</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-xl">
              Criar conta grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <Footer data={(blocks as any).footer_brand || { brand: 'NeuroLearn' }} />
      </main>
    </>
  );
}

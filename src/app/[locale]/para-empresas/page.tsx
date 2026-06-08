import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Building2, Users, Shield, Sparkles, BarChart3, Headphones, Upload, Briefcase, Crown, Check, ArrowRight, Zap } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Para empresas · NeuroLearn' }; }

const FEATURES = [
  { icon: Upload, title: 'Ingestão de documentos', desc: 'Sobe PDFs, manuais e vídeos. A plataforma gera cursos personalizados em horas — não meses.', cls: 'from-violet-500 to-indigo-600' },
  { icon: Shield, title: 'White-label completo', desc: 'O teu logo, paleta, domínio. Os colaboradores vêem a tua marca, não a NeuroLearn.', cls: 'from-fuchsia-500 to-pink-600' },
  { icon: Users, title: 'Multi-tenant seguro', desc: 'Isolamento total entre organizações. SSO, SCIM, audit logs, RBAC granular.', cls: 'from-emerald-500 to-teal-600' },
  { icon: BarChart3, title: 'Analytics em tempo real', desc: 'Progresso por colaborador, conclusão por equipa, ROI por curso. Export para PowerBI/Tableau.', cls: 'from-amber-500 to-orange-600' },
  { icon: Briefcase, title: 'Marketplace de talento', desc: 'Acede directamente a candidatos certificados na tua stack. Reduz time-to-hire em 60%.', cls: 'from-rose-500 to-red-600' },
  { icon: Headphones, title: 'Account manager dedicado', desc: 'Onboarding guiado, formação aos teus admins, suporte premium em 4 idiomas.', cls: 'from-blue-500 to-cyan-600' },
];

const STEPS = [
  { num: '1', title: 'Onboarding em 24h', desc: 'Sessão de descoberta, configuração de SSO e branding, primeiros utilizadores adicionados.' },
  { num: '2', title: 'Carrega o teu conhecimento', desc: 'Sobe documentos, vídeos, certificações. A plataforma gera percursos personalizados.' },
  { num: '3', title: 'Escala e mede', desc: 'Convida toda a empresa. Mede engajamento, completion, transferência para o trabalho real.' },
];

const TIERS = [
  { name: 'Starter', price: '€8', period: '/colaborador/mês', features: ['Até 50 seats','Marketplace standard','Suporte email','SSO Google + Microsoft'], cls: 'from-slate-500 to-slate-700' },
  { name: 'Pro', price: '€15', period: '/colaborador/mês', features: ['Até 500 seats','White-label completo','SCIM provisioning','Cursos gerados a partir docs','Analytics avançadas'], cls: 'from-violet-500 to-indigo-600', popular: true },
  { name: 'Enterprise', price: 'Custom', period: 'Falar com vendas', features: ['Seats ilimitados','Account manager dedicado','SLA 99.9%','Compliance GDPR auditado','API dedicada','Integração HRIS'], cls: 'from-amber-500 to-orange-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-900 to-indigo-900 text-white">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-violet-200 mb-6 backdrop-blur-sm">
                <Building2 className="h-3.5 w-3.5" /> Solução B2B
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                LMS corporativo <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">com superpoderes</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">
                Multi-tenant, white-label, SSO, SCIM, e geração automática de cursos a partir dos teus próprios documentos. Pronto a usar em 24h.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="mailto:enterprise@neurolearn.pt?subject=Demo" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-700 hover:bg-violet-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                  Marcar demo <ArrowRight className="h-4 w-4" />
                </a>
                <Link href={'/precos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl backdrop-blur-sm">
                  Ver preços
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted by strip */}
        <section className="bg-slate-50 py-8 border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3">Empresas que confiam na NeuroLearn</p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-60 text-slate-700 font-bold text-lg">
              <span>● Healthcare Group</span><span>● TechCorp</span><span>● FinanceHub</span><span>● RetailChain</span><span>● ConsultingFirm</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Tudo o que precisas, num só sítio</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">Construído para escalar de 10 a 10.000 colaboradores sem mudanças de plataforma.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${f.cls} text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-12">Como começamos</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {STEPS.map((s) => (
                <div key={s.num} className="relative bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="absolute -top-4 -left-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xl font-bold flex items-center justify-center shadow-lg">{s.num}</div>
                  <h3 className="font-bold text-slate-900 mt-3 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Preços transparentes</h2>
            <p className="mt-3 text-slate-600">Sem fees escondidas. Sem lock-in. Cancela quando quiseres.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((t, i) => (
              <div key={i} className={`relative bg-white rounded-3xl border-2 ${t.popular ? 'border-violet-500 shadow-2xl scale-105' : 'border-slate-200'} p-6 sm:p-8`}>
                {t.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow">MAIS POPULAR</div>}
                <div className={`inline-flex h-10 w-10 rounded-xl bg-gradient-to-br ${t.cls} text-white items-center justify-center mb-4`}>
                  {t.popular ? <Crown className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <h3 className="font-bold text-xl text-slate-900">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{t.price}</span>
                  <span className="text-sm text-slate-500">{t.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {t.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <a href="mailto:enterprise@neurolearn.pt?subject=Plano" className={`mt-6 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold ${t.popular ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:shadow-lg' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'} transition-all`}>
                  {t.name === 'Enterprise' ? 'Falar com vendas' : 'Começar'} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>

        <Footer data={(blocks as any).footer_brand || { brand: 'NeuroLearn' }} />
      </main>
    </>
  );
}

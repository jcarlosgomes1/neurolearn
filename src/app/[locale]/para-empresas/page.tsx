import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Building2, Users, ShieldCheck, BarChart3, BookOpen, Sparkles, ArrowRight, CheckCircle2, Palette, Globe, Settings2, Zap } from 'lucide-react';

export const revalidate = 3600;
export const metadata = { title: 'Para empresas · NeuroLearn', description: 'LMS corporativo white-label com geração inteligente de cursos a partir dos documentos da tua empresa.' };

export default async function ParaEmpresasPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-900 to-indigo-900 py-24 sm:py-32 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.4),transparent_55%)]" />
          <div className="absolute top-20 left-10 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur border border-white/20 rounded-full text-xs font-semibold mb-5">
                <Building2 className="h-3 w-3" /> Plataforma corporativa
              </span>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
                LMS que cria <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">cursos a partir dos teus PDFs</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">
                Upload manuais, procedimentos, vídeos. Em minutos transformamos em cursos interactivos para a tua equipa. White-label, SSO, ESCO skills.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={'/demo' as any} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-900 hover:bg-slate-100 text-base font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                  Agendar demo <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href={'/business/onboarding' as any} className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-base font-bold rounded-xl">
                  Trial 14 dias grátis
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted by */}
        <section className="py-12 border-y border-slate-100 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center text-xs uppercase tracking-widest font-bold text-slate-500 mb-6">Confiam em nós</div>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-slate-400 font-bold text-lg">
              <div>LogiPort</div><div>•</div><div>GreenMobility PT</div><div>•</div><div>Banco Fintech</div><div>•</div><div>SaúdeMais</div><div>•</div><div>EnergiaPlus</div><div>•</div><div>RetailHub</div>
            </div>
          </div>
        </section>

        {/* 6 features */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-3">Tudo o que o teu L&D precisa</h2>
            <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">Multi-tenant nativo. Configurável por organização.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Sparkles, title: 'Geração inteligente', text: 'Carrega PDFs, manuais, vídeos. Geramos cursos com módulos, lições e quizzes. Aprovas e ficam disponíveis.', cls: 'from-violet-500 to-indigo-600' },
                { icon: Palette, title: 'White-label completo', text: 'Logo, cores, domínio próprio. Os teus colaboradores nem sabem que é NeuroLearn.', cls: 'from-purple-500 to-fuchsia-600' },
                { icon: ShieldCheck, title: 'SSO + SAML + SCIM', text: 'Microsoft Entra, Okta, Google Workspace. Provisioning automático de utilizadores.', cls: 'from-slate-700 to-slate-900' },
                { icon: BarChart3, title: 'Analytics por equipa', text: 'Dashboards de progresso, taxa de conclusão, skill gaps. Export CSV/API.', cls: 'from-amber-500 to-orange-600' },
                { icon: Globe, title: 'ESCO Skills', text: 'Mapeamento automático para taxonomia oficial europeia (15.000 skills). Compatível com CV.', cls: 'from-blue-500 to-cyan-600' },
                { icon: Users, title: 'Marketplace cursos', text: 'Compra acesso aos cursos do catálogo público para a tua equipa. Pricing por seat.', cls: 'from-emerald-500 to-teal-600' },
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${f.cls} text-white items-center justify-center shadow-lg mb-4`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-12">3 passos para começar</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Cria a tua empresa', text: 'Onboarding em 5 minutos. Trial 14 dias sem cartão.', cls: 'from-violet-500 to-indigo-600' },
                { step: '2', title: 'Upload conteúdos', text: 'Carrega PDFs, manuais, vídeos. Processamos automaticamente.', cls: 'from-emerald-500 to-teal-600' },
                { step: '3', title: 'Convida a equipa', text: 'Bulk invite via email/SCIM. Acompanha progresso em tempo real.', cls: 'from-amber-500 to-orange-600' },
              ].map((s, i) => (
                <div key={i} className="relative bg-white rounded-2xl border border-slate-200 p-6 text-center">
                  <div className={`absolute -top-5 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-gradient-to-br ${s.cls} text-white font-bold flex items-center justify-center shadow-lg`}>{s.step}</div>
                  <h3 className="font-bold text-lg text-slate-900 mt-4 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing tiers */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-3">Planos para qualquer dimensão</h2>
            <p className="text-center text-slate-600 mb-12">Do trial gratuito ao Enterprise ilimitado.</p>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { tier: 'Starter', price: '€49', per: '/mês', desc: 'Até 50 colaboradores', features: ['LMS interno', 'Geração inteligente', '50 seats marketplace', 'Email support'], cls: 'border-slate-200', cta: 'Começar trial' },
                { tier: 'Pro', price: '€199', per: '/mês', desc: 'Até 250 colaboradores', features: ['Tudo do Starter', 'White-label', 'Live sync (aulas)', '250 seats marketplace', '10 contratações/mês'], cls: 'border-violet-300 ring-2 ring-violet-200', cta: 'Trial 14 dias', popular: true },
                { tier: 'Enterprise', price: 'Custom', per: '', desc: 'Ilimitado · SSO/SAML', features: ['Tudo do Pro', 'SSO + SAML + SCIM', 'API access', 'Account manager', 'SLA 99.9%'], cls: 'border-slate-900 bg-slate-900 text-white', cta: 'Contactar vendas' },
              ].map((p, i) => (
                <div key={i} className={`relative rounded-2xl border-2 p-6 ${p.cls}`}>
                  {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-full">POPULAR</span>}
                  <div className="font-bold text-sm uppercase tracking-wider mb-2 opacity-80">{p.tier}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black">{p.price}</span>
                    {p.per && <span className="opacity-70">{p.per}</span>}
                  </div>
                  <div className="text-sm opacity-70 mb-6">{p.desc}</div>
                  <ul className="space-y-2 mb-6 text-sm">
                    {p.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={'/demo' as any} className={`block text-center py-3 rounded-lg font-bold text-sm ${i === 2 ? 'bg-white text-slate-900' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{p.cta}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Trial grátis · sem cartão</h2>
            <p className="text-xl text-white/90 mb-8">14 dias completos para testar com a tua equipa.</p>
            <Link href={'/business/onboarding' as any} className="inline-flex items-center gap-2 px-10 py-4 bg-white text-violet-700 hover:bg-slate-100 text-base font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
              Criar empresa <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

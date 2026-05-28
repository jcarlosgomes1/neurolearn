import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Building2, Users, Shield, Sparkles, BarChart, Headphones } from 'lucide-react';

export const revalidate = 600;
export const metadata = { title: 'Empresas' };

const FEATURES = [
  { icon: Sparkles, title: 'Conteúdo à medida', desc: 'Cursos custom para a tua equipa, criados a partir dos teus próprios materiais.' },
  { icon: Shield, title: 'White-label', desc: 'Domínio próprio, cores, logo e identidade total.' },
  { icon: Users, title: 'Gestão de equipas', desc: 'Adiciona/remove utilizadores em massa, organiza por departamentos.' },
  { icon: BarChart, title: 'Analytics avançado', desc: 'Dashboards de progresso, taxas de conclusão, certificados, ROI.' },
  { icon: Building2, title: 'SSO + SCIM', desc: 'Integração com Microsoft Entra, Okta, Google Workspace.' },
  { icon: Headphones, title: 'Success Manager dedicado', desc: 'Suporte prioritário, formação inicial, revisões trimestrais.' },
];

export default async function CompaniesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <PageHeader badge="🏢 Para empresas" title="Forma a tua equipa em IA. Sem complicações." subtitle="Plataforma white-label para formar a tua equipa em inteligência artificial. Cursos à medida, gestão centralizada, certificados verificáveis.">
          <div className="flex flex-wrap gap-3">
            <a href="mailto:hello@neurolearn.pt?subject=Enterprise" className="btn-primary">Falar com vendas</a>
            <Link href={'/cursos' as any} className="btn-secondary">Ver catálogo</Link>
          </div>
        </PageHeader>
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">Tudo o que precisas para formar a tua equipa</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-brand-200 transition-all">
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed text-pretty">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-slate-50 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Pronto para começar?</h2>
            <p className="mt-4 text-lg text-slate-600">Fala connosco. Em 15 minutos preparamos uma demo personalizada.</p>
            <a href="mailto:hello@neurolearn.pt?subject=Demo" className="btn-primary mt-6 inline-flex text-base px-6 py-3">Agendar demo gratuita</a>
          </div>
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

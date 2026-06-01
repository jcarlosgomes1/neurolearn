import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { CandidaturaForm } from './CandidaturaForm';

export const metadata = {
  title: 'Ensina na NeuroLearn — Candidatura a instrutor',
  description: 'Partilha o teu conhecimento de IA com profissionais portugueses. Candidata-te para te tornares instrutor.',
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <section className="bg-gradient-to-br from-brand-50 via-purple-50 to-white pt-16 pb-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-700 bg-white px-3 py-1.5 rounded-full mb-5 shadow-sm">🎓 Programa de instrutores</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] text-balance">Teach applied AI to people who build</h1>
            <p className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed text-balance">We're looking for practitioners with real-world experience to build hands-on AI courses. No hype, just useful skills.</p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-2xl mb-1">💰</div>
                <div className="text-sm font-semibold text-slate-900">50% revenue share</div>
                <div className="text-xs text-slate-500 mt-1">On every course you launch</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-2xl mb-1">🛠</div>
                <div className="text-sm font-semibold text-slate-900">AI-assisted authoring</div>
                <div className="text-xs text-slate-500 mt-1">Tools to draft lessons faster</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-2xl mb-1">🌍</div>
                <div className="text-sm font-semibold text-slate-900">Global audience</div>
                <div className="text-xs text-slate-500 mt-1">Courses in any language</div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <CandidaturaForm />
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Como funciona o processo</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">1</span>
              <div>
                <h3 className="font-semibold text-slate-900">Submetes a candidatura</h3>
                <p className="text-sm text-slate-600">Conta-nos sobre ti, a tua experiência e o curso que queres criar.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">2</span>
              <div>
                <h3 className="font-semibold text-slate-900">Análise inicial em 24-48h</h3>
                <p className="text-sm text-slate-600">A nossa IA faz uma avaliação preliminar com base no perfil e na proposta.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">3</span>
              <div>
                <h3 className="font-semibold text-slate-900">Revisão pela equipa</h3>
                <p className="text-sm text-slate-600">Os admins revêem os top candidatos em 5-10 dias úteis. Decisão por email.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">4</span>
              <div>
                <h3 className="font-semibold text-slate-900">Onboarding e primeiro curso</h3>
                <p className="text-sm text-slate-600">Se aprovado, defines password, completas o onboarding e começas a criar.</p>
              </div>
            </li>
          </ol>
        </section>

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

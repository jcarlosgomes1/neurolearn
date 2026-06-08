import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { GraduationCap, Euro, Users, Mic, PenTool, BarChart3, ArrowRight, CheckCircle2, Sparkles, Zap, Award } from 'lucide-react';

export const revalidate = 3600;
export const metadata = { title: 'Para instrutores · NeuroLearn', description: 'Cria, vende e escala os teus cursos. 70% revshare, ferramentas premium, audiência global.' };

export default async function ParaInstrutoresPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.2),transparent_55%)]" />
          <div className="absolute top-20 right-10 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl animate-pulse" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur border border-amber-200 rounded-full text-xs font-semibold text-amber-700 mb-5">
                <GraduationCap className="h-3 w-3" /> Programa de instrutores
              </span>
              <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight">
                Cria. Vende. <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Escala.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-700 leading-relaxed">
                Ferramentas profissionais para criar cursos. Audiência global. 70% revshare. Tudo o que precisas para viver do que sabes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={'/candidatar' as any} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-base font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                  Candidatar agora <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href={'/casos-de-sucesso' as any} className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-base font-bold rounded-xl">
                  Ver histórias
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '70%', label: 'Revshare', cls: 'from-emerald-500 to-teal-600' },
                { value: '12k+', label: 'Audiência', cls: 'from-violet-500 to-indigo-600' },
                { value: '4 línguas', label: 'Auto-translate', cls: 'from-blue-500 to-cyan-600' },
                { value: '<48h', label: 'Pagamento', cls: 'from-rose-500 to-pink-600' },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.cls} rounded-2xl p-6 text-white shadow-lg`}>
                  <div className="text-4xl font-black">{s.value}</div>
                  <div className="text-sm font-semibold mt-1 opacity-90">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-3">Tudo o que precisas para criar</h2>
            <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">Ferramentas premium, hospedagem incluída, marketing distribuído.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: PenTool, title: 'Editor profissional', text: 'Estrutura módulos, lições, quizzes, projectos. Markdown, vídeo, ficheiros — tudo num só sítio.', cls: 'from-violet-500 to-indigo-600' },
                { icon: Mic, title: 'Vídeo Mux nativo', text: 'Upload directo, encoding automático, streaming adaptativo. Sem custos extra.', cls: 'from-rose-500 to-pink-600' },
                { icon: Sparkles, title: 'Tutor inteligente integrado', text: 'Cada aula tem um tutor que responde dúvidas dos alunos no contexto. Tu mantens o controlo.', cls: 'from-fuchsia-500 to-purple-600' },
                { icon: BarChart3, title: 'Analytics em tempo real', text: 'Engagement, taxa de conclusão, dropoff por lição. Optimiza sem adivinhar.', cls: 'from-amber-500 to-orange-600' },
                { icon: Users, title: 'B2B + B2C', text: 'Empresas compram acesso à tua biblioteca por seats. Ganhos extra sem esforço.', cls: 'from-blue-500 to-cyan-600' },
                { icon: Award, title: 'Certificados verificáveis', text: 'QR code único por aluno. Branding partilhado. Valoriza o teu curso no mercado.', cls: 'from-emerald-500 to-teal-600' },
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

        {/* Revshare comparison */}
        <section className="py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-12">Ganha mais do que noutras plataformas</h2>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-3 text-sm">
                <div className="p-4 sm:p-6 border-b border-r border-slate-100 font-bold text-slate-500 uppercase text-xs tracking-wider">Plataforma</div>
                <div className="p-4 sm:p-6 border-b border-r border-slate-100 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Revshare instrutor</div>
                <div className="p-4 sm:p-6 border-b border-slate-100 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Pagamento</div>
                {[
                  { name: 'Udemy', rev: '37–97%*', pay: '60 dias' },
                  { name: 'Coursera', rev: '~50%', pay: '90 dias' },
                  { name: 'Teachable', rev: '~90%', pay: '30 dias' },
                  { name: 'NeuroLearn', rev: '70%', pay: '<48h', highlight: true },
                ].map((r, i) => (
                  <div key={i} className={`contents ${r.highlight ? 'bg-emerald-50' : ''}`}>
                    <div className={`p-4 border-r border-slate-100 ${r.highlight ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-700'}`}>{r.name}{r.highlight && ' ★'}</div>
                    <div className={`p-4 border-r border-slate-100 text-center ${r.highlight ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-700'}`}>{r.rev}</div>
                    <div className={`p-4 text-center ${r.highlight ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-700'}`}>{r.pay}</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 p-4 border-t border-slate-100">* Udemy: 37% organic / 97% próprios cupões. Outras plataformas variam por nicho/plano.</p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-amber-600 to-orange-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Vamos avaliar a tua candidatura</h2>
            <p className="text-xl text-white/90 mb-8">Resposta em 48h. Sem custos. Sem exclusividade.</p>
            <Link href={'/candidatar' as any} className="inline-flex items-center gap-2 px-10 py-4 bg-white text-orange-700 hover:bg-slate-100 text-base font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
              Candidatar agora <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

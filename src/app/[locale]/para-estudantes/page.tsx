import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { GraduationCap, Briefcase, Award, Globe, Zap, MessageSquare, ArrowRight, CheckCircle2, Sparkles, Users } from 'lucide-react';

export const revalidate = 3600;
export const metadata = { title: 'Para estudantes · NeuroLearn', description: 'Aprende ao teu ritmo, na tua língua. Certificados verificáveis. Comunidade activa.' };

export default async function ParaEstudantesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15),transparent_55%)]" />
          <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-cyan-300/15 blur-3xl animate-pulse" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur border border-blue-200 rounded-full text-xs font-semibold text-blue-700 mb-5">
              <GraduationCap className="h-3 w-3" /> Aprende em qualquer lado
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight">
              Domina IA <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">no teu ritmo</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Cursos práticos do iniciante ao avançado. Tutor inteligente em cada lição. Certificados verificáveis. Tudo a partir de €19/mês.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-base font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                Explorar cursos <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href={'/onboarding/student' as any} className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-base font-bold rounded-xl">
                Começar grátis
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-3">Pensado para quem trabalha</h2>
            <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">Aulas curtas, projectos práticos, comunidade activa. Sem fluff.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Zap, title: 'Aulas curtas (5–15 min)', text: 'Aprende nos intervalos. Mobile-first. Continua de onde parou em qualquer dispositivo.', cls: 'from-amber-500 to-orange-600' },
                { icon: Sparkles, title: 'Tutor inteligente integrado', text: 'Não percebeste? Pergunta directamente no contexto da aula. Resposta em segundos.', cls: 'from-violet-500 to-indigo-600' },
                { icon: Globe, title: '4 línguas, tradução cuidada', text: 'PT, EN, ES, FR. Sem tradução literal. Muda a língua a qualquer momento.', cls: 'from-blue-500 to-cyan-600' },
                { icon: Award, title: 'Certificados verificáveis', text: 'QR code único. Verificável por qualquer empresa. Adiciona ao LinkedIn em 1 clique.', cls: 'from-emerald-500 to-teal-600' },
                { icon: Briefcase, title: 'Marketplace de talento', text: 'Conclui o percurso e fica visível para empresas que procuram a tua skill.', cls: 'from-rose-500 to-pink-600' },
                { icon: MessageSquare, title: 'Comunidade activa', text: 'Pergunta a outros alunos, partilha projectos, faz networking. Discord + plataforma.', cls: 'from-fuchsia-500 to-purple-600' },
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

        <section className="py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-12">3 percursos, 1 destino</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { emoji: '🌱', level: 'Iniciante', title: 'Fundamentos', text: 'Começa do zero. ChatGPT, Excel, automação básica. Em 30 dias estás a aplicar.', cls: 'from-emerald-500 to-teal-600', courses: ['Fundamentos IA', 'Excel com IA', 'Prompt Engineering'] },
                { emoji: '🚀', level: 'Intermédio', title: 'Aplicação', text: 'Constrói. NLP, agentes, integrações. Em 60 dias tens projectos no portfolio.', cls: 'from-violet-500 to-indigo-600', courses: ['NLP e Texto', 'IA para Negócios', 'Computer Vision'] },
                { emoji: '⚡', level: 'Avançado', title: 'Especialização', text: 'Domina. Agentes complexos, fine-tuning, deployment. Pronto para sénior.', cls: 'from-amber-500 to-orange-600', courses: ['Agentes LangChain', 'Computer Vision', 'IA para Negócios'] },
              ].map((p, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className={`p-6 bg-gradient-to-br ${p.cls} text-white`}>
                    <div className="text-4xl mb-2">{p.emoji}</div>
                    <div className="text-xs uppercase tracking-wider font-bold opacity-80">{p.level}</div>
                    <div className="text-xl font-bold mt-1">{p.title}</div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{p.text}</p>
                    <div className="space-y-1">
                      {p.courses.map((c, ci) => (
                        <div key={ci} className="text-xs text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{c}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Começa agora, sem cartão</h2>
            <p className="text-xl text-white/90 mb-8">2 aulas grátis por curso. Cancela a subscrição quando quiseres.</p>
            <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-700 hover:bg-slate-100 text-base font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
              Explorar cursos <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { GraduationCap, BookOpen, Briefcase, Award, Headphones, Sparkles, ArrowRight, CheckCircle2, Zap, Users } from 'lucide-react';

export const metadata = { title: 'Para Estudantes · NeuroLearn', description: 'Aprende. Pratica. Ganha. O caminho mais curto entre saber e trabalhar.' };

const FEATURES = [
  { icon: BookOpen, title: 'Cursos práticos', text: 'Construídos por profissionais activos. Exercícios reais, não académicos.', grad: 'from-blue-500 to-cyan-600' },
  { icon: Sparkles, title: 'Tutor disponível 24/7', text: 'Dúvida às 3am? Tens ajuda instantânea contextualizada à lição.', grad: 'from-violet-500 to-fuchsia-600' },
  { icon: Award, title: 'Certificados verificáveis', text: 'Cada certificado tem código único. Empresas confirmam autenticidade.', grad: 'from-emerald-500 to-teal-600' },
  { icon: Briefcase, title: 'Talent marketplace', text: 'Termina o percurso, fica visível para empresas que procuram a tua skill.', grad: 'from-amber-500 to-orange-600' },
  { icon: Users, title: 'Aprende com pares', text: 'Q&A em cada lição. Reviews verificadas. Comunidade activa.', grad: 'from-fuchsia-500 to-pink-600' },
  { icon: Headphones, title: 'Suporte humano', text: 'Equipa responde em horas, não dias. Email, chat e WhatsApp.', grad: 'from-rose-500 to-red-600' },
];

const PATHS = [
  { level: 'Iniciante', title: 'Programação do zero', hours: '~80h', courses: 6, grad: 'from-blue-500 to-cyan-600' },
  { level: 'Intermédio', title: 'Data Analyst Profissional', hours: '~120h', courses: 9, grad: 'from-violet-500 to-fuchsia-600' },
  { level: 'Avançado', title: 'Engenharia de Dados', hours: '~180h', courses: 12, grad: 'from-emerald-500 to-teal-600' },
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.3),transparent_50%)]" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}} />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur border border-blue-400/30 text-xs font-semibold mb-6">
              <GraduationCap className="h-3 w-3 text-cyan-300" /> Para estudantes
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
              Aprende. Pratica.<br /><span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Ganha.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mb-8">O caminho mais curto entre saber alguma coisa e trabalhar nisso.</p>
            <div className="flex flex-wrap gap-3">
              <Link href={'/register' as any} className="inline-flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
                Começar grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={'/cursos' as any} className="inline-flex items-center gap-1.5 px-6 py-3 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all">
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Construído à volta de ti</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Aprender já não tem de ser solitário ou aborrecido</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 transition-all">
                  <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${f.grad} text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Percursos populares</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Escolhe o teu nível, segue um percurso estruturado</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {PATHS.map((p, i) => (
                <Link key={p.title} href={'/aprender/percursos' as any} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all">
                  <div className={`bg-gradient-to-br ${p.grad} p-6 text-white`}>
                    <div className="text-[10px] uppercase tracking-wider opacity-80 mb-2">{p.level}</div>
                    <div className="text-xl font-bold mb-2 min-h-[3rem]">{p.title}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{p.hours}</span>
                      <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{p.courses} cursos</span>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="space-y-1.5">
                      {['Certificado verificável', 'Tutor 24/7', 'Talent matching'].map((b) => (
                        <div key={b} className="flex items-center gap-1.5 text-xs text-slate-600"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {b}</div>
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Zap className="h-12 w-12 mx-auto mb-5 text-amber-300" />
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">A primeira aula é grátis</h2>
            <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">Cria conta em 60 segundos. Sem cartão. Acesso imediato.</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-1.5 px-7 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
              Começar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

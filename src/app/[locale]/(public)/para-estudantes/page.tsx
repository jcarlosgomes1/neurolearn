import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Compass, Briefcase, Award, Brain, Zap, Sparkles, ArrowRight, Target, BookMarked, MessageCircle } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Para estudantes · NeuroLearn' }; }

const FEATURES = [
  { icon: Compass, title: 'Percursos guiados', desc: 'Sequências curadas por especialistas: do zero até empregabilidade real, com checkpoints validados.', cls: 'from-blue-500 to-cyan-600' },
  { icon: Brain, title: 'Tutor personalizado 24/7', desc: 'Tira dúvidas sobre cada lição, recebe explicações alternativas, treina conceitos com exercícios à medida.', cls: 'from-violet-500 to-indigo-600' },
  { icon: Award, title: 'Certificados verificáveis', desc: 'Cada certificado tem URL público e validação criptográfica. Aparece no LinkedIn directamente.', cls: 'from-amber-500 to-orange-600' },
  { icon: Briefcase, title: 'Acesso a vagas', desc: 'Completaste o percurso? És automaticamente apresentado a vagas de empresas parceiras na tua stack.', cls: 'from-emerald-500 to-teal-600' },
  { icon: Target, title: 'Projectos reais', desc: 'Cada curso termina com um projecto avaliado. Sai com portfólio, não com PDFs no Drive.', cls: 'from-rose-500 to-red-600' },
  { icon: MessageCircle, title: 'Comunidade activa', desc: 'Pergunta a outros alunos, instrutores, e a profissionais que já passaram por onde estás agora.', cls: 'from-fuchsia-500 to-pink-600' },
];

const PATHS = [
  { title: 'Iniciante curioso', desc: 'Nunca programaste? Começa pelo Python, JavaScript ou Design. Pré-requisitos: zero.', icon: '🌱', cls: 'from-emerald-500 to-teal-600' },
  { title: 'Profissional em transição', desc: 'Já trabalhas mas queres mudar de área. Percursos de 4-8 meses com mentoria.', icon: '🔄', cls: 'from-violet-500 to-indigo-600' },
  { title: 'Especialista a aprofundar', desc: 'Já és sénior? Conteúdo avançado em arquitectura, leadership, optimização.', icon: '🎯', cls: 'from-amber-500 to-orange-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200 text-xs font-semibold text-blue-700 mb-6 shadow-sm">
              <Compass className="h-3.5 w-3.5" /> Para estudantes
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Aprende com <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">propósito</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Percursos curados, projectos reais, certificação verificável, e ponte directa para empregos. Não é só conteúdo — é resultado.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600 to-cyan-600 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                Começar grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all font-bold rounded-xl shadow-sm">
                Explorar catálogo
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Tudo o que precisas para crescer</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">Aprendizagem que respeita o teu tempo e te dá ferramentas para evoluir profissionalmente.</p>
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

        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-12">Qual destes és tu?</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {PATHS.map((p, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="text-4xl mb-3">{p.icon}</div>
                  <h3 className={`font-bold text-lg bg-gradient-to-br ${p.cls} bg-clip-text text-transparent`}>{p.title}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 p-10 sm:p-14 shadow-2xl text-center text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-70" />
            <h2 className="text-3xl sm:text-4xl font-bold">Cria a tua conta em 30 segundos</h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">Free tier sem limite de tempo. Sem cartão de crédito. Acesso imediato a centenas de cursos e percursos.</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-2 px-8 py-3.5 mt-8 bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
              Criar conta grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
  );
}

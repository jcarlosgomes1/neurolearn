import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Users, MessageSquare, Calendar, Heart, Trophy, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

export const revalidate = 3600;
export const metadata = { title: 'Comunidade · NeuroLearn', description: 'Junta-te a 12.000+ profissionais que aprendem juntos.' };

export default async function ComunidadePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-50 via-pink-50 to-rose-50 py-20 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(217,70,239,0.15),transparent_55%)]" />
          <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl animate-pulse" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur border border-fuchsia-200 rounded-full text-xs font-semibold text-fuchsia-700 mb-5">
              <Users className="h-3 w-3" /> Comunidade
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight">
              Aprende com <span className="bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">12.000+ pessoas</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Networking, ajuda mútua, projectos em colaboração. Tudo num só sítio.</p>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5 text-center">
            {[
              { value: '12k+', label: 'Membros activos', cls: 'from-violet-600 to-indigo-600' },
              { value: '850', label: 'Mensagens/dia', cls: 'from-emerald-500 to-teal-600' },
              { value: '50+', label: 'Projectos partilhados', cls: 'from-amber-500 to-orange-600' },
              { value: '4', label: 'Eventos/mês', cls: 'from-fuchsia-500 to-pink-600' },
            ].map((s, i) => (
              <div key={i}>
                <div className={`text-5xl sm:text-6xl font-black bg-gradient-to-br ${s.cls} bg-clip-text text-transparent`}>{s.value}</div>
                <div className="text-sm text-slate-600 mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-12">Onde encontrar a comunidade</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: MessageSquare, title: 'Discord oficial', text: '12k+ membros. Channels por tópico. Suporte de outros alunos 24/7.', cta: 'Entrar no Discord', cls: 'from-violet-500 to-indigo-600', external: true },
                { icon: Heart, title: 'Perguntas nos cursos', text: 'Cada aula tem secção de Q&A. Instrutores e alunos respondem.', cta: 'Explorar cursos', cls: 'from-rose-500 to-pink-600', external: false },
                { icon: Calendar, title: 'Eventos mensais', text: 'Workshops, AMAs, demo days. Gratuitos para subscritores.', cta: 'Ver agenda', cls: 'from-emerald-500 to-teal-600', external: false },
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${c.cls} text-white items-center justify-center shadow-lg mb-4`}>
                    <c.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{c.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">{c.text}</p>
                  <button className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-violet-700">
                    {c.cta} {c.external ? <ExternalLink className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-12">Code of Conduct</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-700">
              {[
                { do: true, text: 'Sê respeitoso. Trata todos como gostarias de ser tratado.' },
                { do: true, text: 'Partilha aprendizagem. Ensina o que sabes.' },
                { do: true, text: 'Pergunta com contexto. Ajuda os outros a ajudarem-te.' },
                { do: true, text: 'Celebra os outros. Aplaude vitórias da comunidade.' },
                { do: false, text: 'Sem spam, sem self-promotion agressiva.' },
                { do: false, text: 'Sem discriminação, assédio ou linguagem ofensiva.' },
                { do: false, text: 'Sem partilhar conteúdos pagos sem autorização.' },
                { do: false, text: 'Sem pedidos de código completo "para amanhã".' },
              ].map((r, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-lg ${r.do ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                  <span className={`text-lg ${r.do ? 'text-emerald-600' : 'text-rose-600'} font-bold flex-shrink-0`}>{r.do ? '✓' : '✗'}</span>
                  <span className="leading-relaxed">{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Users, MessageCircle, Calendar, Heart, Shield, Sparkles, ArrowRight, Github, Trophy } from 'lucide-react';

export const metadata = { title: 'Comunidade · NeuroLearn', description: 'Junta-te a 15.000+ pessoas a aprender em conjunto. Discord, Q&A e eventos.' };

const CHANNELS = [
  { icon: MessageCircle, name: 'Discord', desc: 'Canal #ajuda activo 24/7. Estudo em grupo. Voice chats semanais.', cta: 'Entrar no servidor', members: '15k+', grad: 'from-indigo-500 to-purple-600' },
  { icon: Github, name: 'Q&A público', desc: 'Pergunta. Responde. Aprende lendo o que outros perguntam.', cta: 'Explorar', members: '8k threads', grad: 'from-slate-700 to-slate-900' },
  { icon: Calendar, name: 'Eventos & meetups', desc: 'Workshops mensais, AMAs com instrutores convidados, meetups locais.', cta: 'Ver calendário', members: '32 próximos', grad: 'from-amber-500 to-orange-600' },
];

const RULES = [
  'Sê respeitoso. Sempre.',
  'Ajuda quando puderes. Não há perguntas estúpidas.',
  'Sem spam, sem promoção não autorizada.',
  'Privacidade respeitada. Nada de DMs sem permissão.',
  'Português, Inglês, Espanhol, Francês são todos bem-vindos.',
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-950 via-pink-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.3),transparent_50%)]" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/20 backdrop-blur border border-fuchsia-400/30 text-xs font-semibold mb-6">
              <Heart className="h-3 w-3 text-fuchsia-300" /> Junta-te à comunidade
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Aprender é melhor <span className="bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">em conjunto</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">15.000+ pessoas a partilhar dúvidas, vitórias e oportunidades. Todos os dias.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 max-w-2xl mx-auto">
              {[{v:'15k+',l:'Membros'},{v:'8k',l:'Q&A threads'},{v:'32',l:'Eventos/ano'},{v:'4 línguas',l:'Activos'}].map(s => (
                <div key={s.l} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3">
                  <div className="text-2xl font-bold bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">{s.v}</div>
                  <div className="text-[10px] text-slate-300 uppercase tracking-wider mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="text-xs font-semibold text-fuchsia-600 uppercase tracking-wider mb-2">Onde nos encontras</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">3 canais. Uma comunidade.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {CHANNELS.map((c) => (
                <div key={c.name} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all">
                  <div className={`bg-gradient-to-br ${c.grad} p-6 text-white`}>
                    <c.icon className="h-9 w-9 mb-3 opacity-90" />
                    <h3 className="text-2xl font-bold mb-1">{c.name}</h3>
                    <div className="text-xs opacity-80 inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-0.5 rounded-full">
                      <Users className="h-3 w-3" /> {c.members}
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed mb-5">{c.desc}</p>
                    <button className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors">
                      {c.cta} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-3xl p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-5">
                <Shield className="h-7 w-7 text-fuchsia-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Código de conduta</h2>
              </div>
              <p className="text-sm text-slate-600 mb-5">A comunidade só funciona se for um sítio seguro. Estas são as regras simples que todos seguimos:</p>
              <ul className="space-y-3">
                {RULES.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="inline-flex h-6 w-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white text-xs font-bold items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-6 italic">Quem violar pode ser silenciado ou banido. Reportar abusos: comunidade@neurolearn.com</p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-5 text-amber-300" />
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">Os melhores são reconhecidos</h2>
            <p className="text-lg text-fuchsia-100 mb-8 max-w-xl mx-auto">Membros activos podem ser convidados como mentores, beta-testers ou contribuir para curriculum.</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-1.5 px-7 py-3 bg-white text-fuchsia-700 font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
              Juntar-me agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

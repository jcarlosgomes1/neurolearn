import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Search, HelpCircle, User, BookOpen, CreditCard, Award, Building2, Lock, MessageCircle, Mail, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Centro de ajuda · NeuroLearn', description: 'Respostas rápidas para qualquer dúvida sobre conta, cursos, pagamentos, certificados, empresas e privacidade.' };

const CATS = [
  { icon: User, name: 'Conta', count: 18, grad: 'from-blue-500 to-cyan-600', items: ['Recuperar password', 'Mudar email', 'Eliminar conta', 'Login com Google'] },
  { icon: BookOpen, name: 'Cursos', count: 24, grad: 'from-violet-500 to-fuchsia-600', items: ['Como me inscrevo num curso?', 'Posso ver offline?', 'Velocidade de vídeo', 'Notas e progresso'] },
  { icon: CreditCard, name: 'Pagamentos', count: 15, grad: 'from-emerald-500 to-teal-600', items: ['Reembolsos', 'Métodos aceites', 'Renovações automáticas', 'Facturas'] },
  { icon: Award, name: 'Certificados', count: 9, grad: 'from-amber-500 to-orange-600', items: ['Quando recebo?', 'Validar certificado', 'Partilhar no LinkedIn', 'Verificar de outros'] },
  { icon: Building2, name: 'Empresas', count: 21, grad: 'from-fuchsia-500 to-pink-600', items: ['Como funciona o B2B?', 'Gerir colaboradores', 'Faturação anual', 'Single Sign-On'] },
  { icon: Lock, name: 'Privacidade & GDPR', count: 12, grad: 'from-slate-700 to-slate-900', items: ['Exportar os meus dados', 'Direito a esquecimento', 'Cookies', 'Notificações'] },
];

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_60%)]" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold mb-6">
              <HelpCircle className="h-3 w-3 text-violet-300" /> Centro de ajuda
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Como te podemos ajudar?</h1>
            <div className="relative max-w-xl mx-auto">
              <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Procurar... (ex: como recupero a password)"
                className="w-full pl-12 pr-4 py-4 bg-white text-slate-900 rounded-2xl shadow-xl outline-none focus:ring-4 focus:ring-violet-500/30" />
            </div>
            <p className="text-xs text-slate-400 mt-3">Mais de 99 artigos. Resposta humana em &lt;24h.</p>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Navegar por categoria</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CATS.map((c) => (
                <div key={c.name} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all">
                  <div className={`bg-gradient-to-br ${c.grad} p-5 text-white`}>
                    <div className="flex items-start justify-between">
                      <c.icon className="h-7 w-7 opacity-90" />
                      <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{c.count}</span>
                    </div>
                    <h3 className="font-bold text-lg mt-3">{c.name}</h3>
                  </div>
                  <div className="p-5 space-y-1.5">
                    {c.items.map((q) => (
                      <div key={q} className="text-sm text-slate-700 py-1.5 hover:text-violet-700 cursor-pointer flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-violet-500" /> {q}
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100 mt-3">
                      <span className="text-xs font-semibold text-slate-500 group-hover:text-violet-700">Ver todas ({c.count}) →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-3xl p-8 sm:p-10 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-violet-600" />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Não encontras o que procuras?</h2>
              <p className="text-slate-600 mb-7 max-w-lg mx-auto">A nossa equipa humana responde em menos de 24h. Sem chatbots, sem tickets perdidos.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="mailto:ajuda@neurolearn.com" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition-all">
                  <Mail className="h-4 w-4" /> ajuda@neurolearn.com
                </a>
                <Link href={'/comunidade' as any} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-all">
                  <MessageCircle className="h-4 w-4" /> Perguntar à comunidade
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

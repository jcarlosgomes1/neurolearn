import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { LifeBuoy, Search, BookOpen, CreditCard, User, Award, ShieldCheck, Building2, MessageSquare, ArrowRight } from 'lucide-react';

export const revalidate = 3600;
export const metadata = { title: 'Centro de ajuda · NeuroLearn', description: 'Respostas para as perguntas mais frequentes.' };

const CATEGORIES = [
  { icon: User, title: 'Conta & login', count: 12, cls: 'from-violet-500 to-indigo-600',
    questions: [
      { q: 'Como recupero a minha password?', a: 'Vai a /login → "Esqueceste-te?" → insere o teu email. Recebes link em segundos.' },
      { q: 'Posso mudar o meu email?', a: 'Sim, em Conta → Segurança → Alterar email. Confirmamos via email antigo e novo.' },
      { q: 'Como ativo o 2FA?', a: 'Conta → Segurança → Adicionar factor. Funciona com Google Authenticator, 1Password, Authy.' },
    ]
  },
  { icon: BookOpen, title: 'Cursos & aprendizagem', count: 18, cls: 'from-emerald-500 to-teal-600',
    questions: [
      { q: 'Posso descarregar as aulas?', a: 'Vídeo não, mas materiais (PDFs, code samples) sim. Disponível em cada lição.' },
      { q: 'Em quantas línguas estão os cursos?', a: 'Todos os cursos em PT, EN, ES, FR. Tradução adaptada, não literal.' },
      { q: 'Os cursos atualizam?', a: 'Sim, revisão trimestral. Notificamos os alunos quando há grandes updates.' },
    ]
  },
  { icon: CreditCard, title: 'Pagamentos & subscrição', count: 14, cls: 'from-amber-500 to-orange-600',
    questions: [
      { q: 'Que métodos aceitam?', a: 'Visa, Mastercard, Amex, MB WAY, SEPA via Stripe. Empresas: factura com NIF.' },
      { q: 'Posso pedir reembolso?', a: 'Sim, dentro de 14 dias após compra, desde que não tenhas começado mais de 1 lição.' },
      { q: 'Como cancelo a subscrição?', a: 'Conta → Subscrição → Cancelar. Mantens acesso até ao fim do período pago.' },
    ]
  },
  { icon: Award, title: 'Certificados', count: 8, cls: 'from-rose-500 to-pink-600',
    questions: [
      { q: 'Como obtenho o certificado?', a: 'Conclui 100% das lições e passa o exame final (≥70%). Emissão automática em PDF.' },
      { q: 'Como verifico um certificado?', a: 'Vai a /verify/[código] ou faz scan do QR code. Validação em segundos.' },
      { q: 'Posso adicionar ao LinkedIn?', a: 'Sim, botão directo "Adicionar ao LinkedIn" na página do certificado.' },
    ]
  },
  { icon: Building2, title: 'Empresas & equipas', count: 16, cls: 'from-blue-500 to-cyan-600',
    questions: [
      { q: 'Como funciona o LMS B2B?', a: 'Cria empresa em /business/onboarding. Trial 14 dias. Bulk invite. Dashboards equipa.' },
      { q: 'Posso usar SSO?', a: 'Sim, plano Enterprise inclui SAML para Microsoft Entra, Okta, Google Workspace.' },
      { q: 'O white-label inclui domínio próprio?', a: 'Sim, plano Pro+. Subdomínio incluído. Domínio custom no Enterprise.' },
    ]
  },
  { icon: ShieldCheck, title: 'Privacidade & GDPR', count: 9, cls: 'from-slate-700 to-slate-900',
    questions: [
      { q: 'Onde estão os meus dados?', a: 'Servidores em UE (Irlanda). Conformes RGPD/GDPR. Encriptados em repouso e trânsito.' },
      { q: 'Como peço os meus dados (acesso)?', a: 'Conta → Privacidade → Exportar dados. Recebes ficheiro completo em 24h por email.' },
      { q: 'Como apago a minha conta?', a: 'Conta → Privacidade → Apagar conta. Eliminação total em até 30 dias.' },
    ]
  },
];

export default async function AjudaPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-violet-50 py-20 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.1),transparent_55%)]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 mb-5">
              <LifeBuoy className="h-3 w-3 text-violet-600" /> Centro de ajuda
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">
              Como podemos ajudar?
            </h1>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" placeholder="Procurar respostas..." className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl text-base focus:border-violet-500 outline-none shadow-sm" />
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, ci) => (
              <details key={ci} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group">
                <summary className="p-6 cursor-pointer hover:bg-slate-50/40 list-none">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${cat.cls} text-white flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <cat.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900">{cat.title}</div>
                      <div className="text-xs text-slate-500">{cat.count} perguntas</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-open:rotate-90 transition-transform" />
                  </div>
                </summary>
                <div className="px-6 pb-6 space-y-3 border-t border-slate-100 pt-4">
                  {cat.questions.map((q, qi) => (
                    <details key={qi} className="text-sm">
                      <summary className="font-semibold text-slate-800 cursor-pointer hover:text-violet-700">{q.q}</summary>
                      <p className="mt-2 text-slate-600 leading-relaxed text-xs pl-3 border-l-2 border-violet-200">{q.a}</p>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-sm">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white items-center justify-center shadow-lg mb-5">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Não encontraste resposta?</h2>
            <p className="text-slate-600 mb-6">Resposta em até 24h em dias úteis. Mais rápido na comunidade.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="mailto:suporte@neurolearn.app" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-lg">
                Contactar suporte
              </a>
              <Link href={'/comunidade' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-sm font-bold rounded-lg">
                Perguntar à comunidade
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}

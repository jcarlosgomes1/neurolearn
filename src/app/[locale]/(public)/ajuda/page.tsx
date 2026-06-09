import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Search, HelpCircle, User, BookOpen, CreditCard, Award, Building2, ShieldCheck, ArrowRight, MessageCircle, Mail } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Centro de ajuda · NeuroLearn' }; }

const CATS = [
  { icon: User, title: 'Conta e perfil', href: '/conta', items: ['Criar conta', 'Recuperar password', 'Apagar conta (GDPR)', 'Mudar email', 'Activar 2FA'], cls: 'from-violet-500 to-indigo-600' },
  { icon: BookOpen, title: 'Cursos e aprendizagem', href: '/cursos', items: ['Inscrever-me num curso', 'Descarregar materiais', 'Tutor 24/7', 'Velocidade vídeo', 'Subtítulos'], cls: 'from-emerald-500 to-teal-600' },
  { icon: CreditCard, title: 'Pagamentos e faturação', href: '/legal/refunds', items: ['Métodos aceites', 'Pedir fatura empresarial', 'Cancelar subscrição', 'Reembolsos', 'IVA internacional'], cls: 'from-amber-500 to-orange-600' },
  { icon: Award, title: 'Certificados', href: '/legal/faq', items: ['Como obter', 'Verificação pública', 'Adicionar ao LinkedIn', 'Reemitir', 'Validade'], cls: 'from-fuchsia-500 to-pink-600' },
  { icon: Building2, title: 'Empresas e seats', href: '/para-empresas', items: ['Comprar seats', 'Convidar colaboradores', 'Atribuir cursos', 'Reportar progresso', 'Reduzir/aumentar plano'], cls: 'from-blue-500 to-cyan-600' },
  { icon: ShieldCheck, title: 'Privacidade e GDPR', href: '/legal/privacy', items: ['Exportar os meus dados', 'Direito ao esquecimento', 'Política de cookies', 'Como tratamos dados', 'Encarregado de proteção'], cls: 'from-rose-500 to-red-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-6 shadow-sm">
              <HelpCircle className="h-3.5 w-3.5" /> Centro de ajuda
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Como podemos <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ajudar?</span>
            </h1>
            <div className="mt-8 relative max-w-xl mx-auto">
              <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="search" placeholder="Procurar resposta..." className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-lg outline-none focus:border-blue-500" />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATS.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-4 shadow-md`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-3">{c.title}</h3>
                <ul className="space-y-1.5">
                  {c.items.map((it, ii) => (
                    <li key={ii}>
                      <Link href={c.href as any} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                        <ArrowRight className="h-3 w-3 text-slate-400" /> {it}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-t border-slate-200/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Não encontraste o que precisas?</h2>
            <p className="mt-3 text-slate-600">A nossa equipa responde em média em menos de 24h.</p>
            <div className="mt-6 grid sm:grid-cols-1 max-w-md mx-auto">
              <Link href={{ pathname: '/contacto', query: { topic: 'support', from: '/ajuda' } } as any}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group">
                <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-slate-900">Enviar mensagem</div>
                <div className="text-xs text-slate-500 mt-1">Formulário de contacto · resposta &lt; 24h</div>
              </Link>
            </div>
          </div>
        </section>

      </main>
  );
}

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Newspaper, Download, ExternalLink, Mail, Calendar, FileText, Image as ImageIcon } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Imprensa · NeuroLearn' }; }

const RELEASES = [
  { date: '2026-05-12', title: 'NeuroLearn passa a estar disponível em quatro idiomas oficiais', summary: 'Plataforma de aprendizagem internacional lança suporte completo em PT, EN, ES e FR, com tradução automática para instrutores.' },
  { date: '2026-03-08', title: 'Lançamento do Marketplace de Talento', summary: 'Estudantes certificados são automaticamente apresentados a empresas parceiras. Reduz time-to-hire em 60%.' },
  { date: '2026-01-15', title: 'Geração automática de cursos a partir de documentos', summary: 'Empresas podem subir PDFs e gerar percursos completos. Disponível em plano Pro e Enterprise.' },
];

const RESOURCES = [
  { icon: ImageIcon, title: 'Logo e marca', desc: 'PNG, SVG, EPS · Variações monocromáticas e cor', cls: 'from-violet-500 to-indigo-600' },
  { icon: FileText, title: 'Press kit', desc: 'Bio fundadores, fact sheet, screenshots de produto', cls: 'from-emerald-500 to-teal-600' },
  { icon: Calendar, title: 'Marcos da empresa', desc: 'Timeline de produto, financiamento, expansão internacional', cls: 'from-amber-500 to-orange-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-zinc-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-slate-400/10 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-6 shadow-sm">
              <Newspaper className="h-3.5 w-3.5" /> Sala de imprensa
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">Imprensa & Media</h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">Recursos, anúncios e contactos para jornalistas e criadores de conteúdo.</p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Anúncios recentes</h2>
          <div className="space-y-4">
            {RELEASES.map((r, i) => (
              <article key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="text-xs font-semibold text-slate-500 mb-2">{new Date(r.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{r.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{r.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">Recursos disponíveis</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {RESOURCES.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${r.cls} text-white items-center justify-center mb-3 shadow-md`}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{r.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{r.desc}</p>
                  <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:gap-2 transition-all">
                    <Download className="h-3.5 w-3.5" /> Descarregar
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Mail className="h-10 w-10 text-slate-700 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Contacto imprensa</h2>
          <p className="mt-3 text-slate-600">Para entrevistas, comentário a notícias do sector, ou parcerias de conteúdo.</p>
          <Link href={{ pathname: '/contacto', query: { topic: 'press', from: '/imprensa' } } as any}
            className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-gradient-to-br from-slate-800 to-slate-900 hover:scale-105 transition-all text-white font-bold rounded-xl shadow-lg">
            Enviar mensagem <ExternalLink className="h-4 w-4" />
          </Link>
        </section>

        <Footer data={(blocks as any).footer_brand || { brand: 'NeuroLearn' }} />
      </main>
    </>
  );
}

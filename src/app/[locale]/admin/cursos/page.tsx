import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { AdminList } from '../AdminList';

export const metadata = { title: 'Cursos · Admin' };

export default function Page() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-slate-500">Edita cursos existentes ou cria novos AI Essentials.</p>
          <div className="flex gap-2 flex-wrap">
            <Link href={'/admin/essential/novo' as any} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg">+ Manual</Link>
            <Link href={'/admin/curso-ia/novo' as any} className="text-sm bg-gradient-to-r from-brand-600 to-purple-600 text-white font-medium px-4 py-2 rounded-lg shadow hover:shadow-md">✨ Gerar com IA</Link>
          </div>
        </div>
        <AdminList
          title="Todos os cursos"
          action="list_courses"
          dataKey="rows"
          backHref="/admin"
          columns={[
            { key: 'title', label: 'Título', primary: true },
            { key: 'course_type', label: 'Tipo', kind: 'badge' },
            { key: 'category', label: 'Categoria' },
            { key: 'price_cents', label: 'Preço', kind: 'cents' },
            { key: 'published', label: 'Estado', kind: 'badge' },
          ]}
          linkPrefix="/admin/curso/"
          linkSuffix="/editar"
          linkKey="id"
          linkLabel="Editar"
        />
      </main>
    </>
  );
}

import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { AdminList } from '../AdminList';

export const metadata = { title: 'Cursos · Admin' };

export default function Page() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-slate-500">Edita instrutores e cria AI Essentials curados pela equipa.</div>
          <Link href={'/admin/essential/novo' as any} className="btn-primary text-sm">+ Novo AI Essential</Link>
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

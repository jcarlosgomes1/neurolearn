import { Header } from '@/components/layout/Header';
import { AdminList } from '../AdminList';

export const metadata = { title: 'Cursos · Admin' };

export default function Page() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <AdminList
          title="Cursos publicados"
          action="list_courses"
          dataKey="rows"
          backHref="/admin"
          columns={[
            { key: 'title', label: 'Título', primary: true },
            { key: 'category', label: 'Categoria' },
            { key: 'price_cents', label: 'Preço', kind: 'cents' },
            { key: 'rating_avg', label: 'Rating', kind: 'rating' },
          ]}
          linkPrefix="/curso/"
          linkKey="id"
        />
      </main>
    </>
  );
}

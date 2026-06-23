import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { CategoriesClient } from './CategoriesClient';

export const dynamic = 'force-dynamic';

type Cat = {
  slug: string;
  parent: string | null;
  icon: string | null;
  sort: number;
  active: boolean;
  featured_b2c: boolean;
  track: string | null;
  name: string;
  course_count: number;
};

export default async function CategoriasPage({ params }: { params: { locale: string } }) {
  const sb = await createClient();
  const { data } = await sb.rpc('nl_admin_categories_list', { p_lang: params.locale || 'pt' });
  const cats: Cat[] = Array.isArray(data) ? (data as Cat[]) : [];
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🗂️"
        eyebrow="Catálogo"
        title="Categorias"
        description="Curadoria da taxonomia: ativar/ocultar, destacar no catálogo público e ordenar. Aplica-se à plataforma global."
      />
      <CategoriesClient initial={cats} lang={params.locale || 'pt'} />
    </div>
  );
}

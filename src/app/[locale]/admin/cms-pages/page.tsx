import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { CmsPagesClient } from './CmsPagesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCmsPagesPage() {
  const sb = await createClient();
  const { data: pages } = await sb.rpc('nl_admin_pages_list');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="📄"
        eyebrow="CMS · Páginas"
        title="Páginas do site"
      />
      <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
        Cria e edita páginas custom (markdown) com slug próprio, visíveis em <code className="bg-slate-100 px-1 rounded">/p/slug</code>. Múltiplos idiomas, opção de aparecer no menu ou footer.
      </p>
      <CmsPagesClient pages={Array.isArray(pages) ? pages : []} />
    </div>
  );
}

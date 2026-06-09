import { createClient } from '@/lib/supabase/server';
import { CmsPagesClient } from './CmsPagesClient';
import { FileEdit } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCmsPagesPage() {
  const sb = await createClient();
  const { data: pages } = await sb.rpc('nl_admin_pages_list');

  return (
    <div className="">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-fuchsia-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <FileEdit className="h-3.5 w-3.5" /> CMS · Páginas
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Páginas do site</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Cria e edita páginas custom (markdown) com slug próprio, visíveis em <code className="bg-slate-100 px-1 rounded">/p/slug</code>. Múltiplos idiomas, opção de aparecer no menu ou footer.
        </p>
      </div>
      <CmsPagesClient pages={Array.isArray(pages) ? pages : []} />
    </div>
  );
}

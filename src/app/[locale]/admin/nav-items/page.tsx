import { createClient } from '@/lib/supabase/server';
import { NavItemsClient } from './NavItemsClient';
import { Navigation } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NavItemsPage() {
  const sb = await createClient();
  const { data: items } = await sb.rpc('nl_admin_nav_items_list');
  return (
    <div className="">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Navigation className="h-3.5 w-3.5" /> Navegação
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Menus & Footer</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Configura ligações do header, footer e menu do utilizador. Aplica-se à plataforma global.
        </p>
      </div>
      <NavItemsClient items={Array.isArray(items) ? items : []} />
    </div>
  );
}

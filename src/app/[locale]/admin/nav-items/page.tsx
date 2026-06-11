import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { NavItemsClient } from './NavItemsClient';

export const dynamic = 'force-dynamic';

export default async function NavItemsPage() {
  const sb = await createClient();
  const { data: items } = await sb.rpc('nl_admin_nav_items_list');
  return (
    <div className="">
      <AdminPageHeader
        backHref="/admin"
        emoji="🔗"
        eyebrow="Navegação"
        title="Menus & Footer"
        description="Configura ligações do header, footer e menu do utilizador. Aplica-se à plataforma global."
      />
      <NavItemsClient items={Array.isArray(items) ? items : []} />
    </div>
  );
}

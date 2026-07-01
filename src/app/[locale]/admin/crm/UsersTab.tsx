'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UsersClient } from '@/app/[locale]/admin/users/UsersClient';

// Wrapper para embeber a gestão de utilizadores no hub Pessoas: busca os dados
// (que a page servidora fornecia) do lado do cliente e monta o UsersClient tal como está.
export function UsersTab() {
  const [data, setData] = useState<{ currentUserId: string; kpis: any; initialPage: any } | null>(null);
  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: auth } = await sb.auth.getUser();
      const [pageRes, kpisRes] = await Promise.all([
        sb.rpc('nl_admin_users_list', { p_search: null, p_role: null, p_is_active: null, p_limit: 50, p_offset: 0 }),
        sb.rpc('nl_admin_users_kpis'),
      ]);
      setData({
        currentUserId: auth.user?.id || '',
        kpis: kpisRes.data || {},
        initialPage: pageRes.data || { items: [], total: 0 },
      });
    })();
  }, []);
  if (!data) return <div className="py-16 text-center text-sm text-slate-400">A carregar…</div>;
  return <UsersClient currentUserId={data.currentUserId} kpis={data.kpis} initialPage={data.initialPage} />;
}

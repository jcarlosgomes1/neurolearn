import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { I18nClient } from './I18nClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default async function AdminI18nPage() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: namespaces } = await sb.rpc('nl_admin_i18n_namespaces');
  const { data: initial } = await sb.rpc('nl_admin_i18n_list', {
    p_namespace: null, p_search: null, p_only_incomplete: false, p_limit: 50, p_offset: 0,
  });
  const { data: totalCount } = await sb.rpc('nl_admin_i18n_count', {
    p_namespace: null, p_search: null, p_only_incomplete: false,
  });

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        title={safeT('admin.i18n.title', 'Traduções')}
        description={safeT('admin.i18n.description', 'Edita as traduções em PT, EN, ES, FR. As alterações são imediatas.')}
      />
      <I18nClient
        namespaces={Array.isArray(namespaces) ? namespaces : []}
        initialItems={Array.isArray(initial) ? initial : []}
        initialTotal={Number(totalCount) || 0}
        labels={{
          all_namespaces: safeT('admin.i18n.all_namespaces', 'Todos os namespaces'),
          search_placeholder: safeT('admin.i18n.search_placeholder', 'Pesquisar key ou valor…'),
          only_incomplete: safeT('admin.i18n.only_incomplete', 'Apenas incompletas'),
          new_key: safeT('admin.i18n.new_key', 'Nova key'),
          empty: safeT('admin.i18n.empty', 'Nenhuma tradução encontrada.'),
          saved: safeT('admin.i18n.saved', 'Tradução guardada'),
          deleted: safeT('admin.i18n.deleted', 'Key apagada'),
        }}
      />
    </div>
  );
}

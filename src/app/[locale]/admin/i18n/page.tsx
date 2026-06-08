import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { I18nClient } from './I18nClient';
import { Globe } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sky-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Globe className="h-3.5 w-3.5" /> {safeT('admin.i18n.eyebrow', 'Sistema · Traduções')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('admin.i18n.title', 'Traduções')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
          {safeT('admin.i18n.description', 'Edita as traduções em PT, EN, ES, FR. As alterações são imediatas.')}
        </p>
      </header>
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

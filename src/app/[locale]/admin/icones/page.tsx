import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { IconesClient } from './IconesClient';

export const dynamic = 'force-dynamic';

export default async function AdminIconesPage() {
  const sb = await createClient();
  const t = await getTranslations();
  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }
  const { data } = await sb.rpc('nl_admin_glyphs_list');
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        title={safeT('admin.glyphs.title', 'Ícones das páginas')}
        description={safeT('admin.glyphs.description', 'Define o emoji do cabeçalho de cada rota. As alterações são imediatas, sem republicar.')}
      />
      <IconesClient
        initial={Array.isArray(data) ? data : []}
        labels={{
          search: safeT('admin.glyphs.search', 'Pesquisar rota…'),
          route: safeT('admin.glyphs.route', 'Rota'),
          emoji: safeT('admin.glyphs.emoji', 'Emoji'),
          add: safeT('admin.glyphs.add', 'Nova rota'),
          saved: safeT('admin.glyphs.saved', 'Ícone guardado'),
          deleted: safeT('admin.glyphs.deleted', 'Rota removida'),
          empty: safeT('admin.glyphs.empty', 'Sem rotas.'),
          hint: safeT('admin.glyphs.hint', 'A rota deve começar por / (ex: /admin/cursos). O prefixo de idioma é ignorado.'),
        }}
      />
    </div>
  );
}

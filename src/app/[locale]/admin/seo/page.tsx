import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { SeoClient } from './SeoClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/seo');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data: enabled } = await sb.rpc('nl_is_feature_enabled', { p_key: 'seo_audits' });

  const res = enabled
    ? await sb.from('nl_seo_audits').select('id, page_type, page_id, lang, score, issues, suggestions, audited_at').order('audited_at', { ascending: false }).limit(500)
    : { data: [] as unknown[] };
  const data = res.data;

  return (
    <div>
      <AdminPageHeader
        backHref="/admin"
        emoji="🔍"
        eyebrow="Conteúdo · SEO"
        title="Auditorias SEO"
        description="Auditorias geradas automaticamente para cada página de conteúdo, com pontuação e problemas detetados."
      />
      {!enabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Funcionalidade desativada. Ativa em{' '}
          <Link href={'/admin/features' as any} className="font-semibold underline">Funcionalidades</Link>.
        </div>
      ) : (
        <SeoClient audits={(Array.isArray(data) ? data : []) as never} />
      )}
    </div>
  );
}

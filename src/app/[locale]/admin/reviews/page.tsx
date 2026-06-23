import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { ReviewsClient } from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/reviews');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data: enabled } = await sb.rpc('nl_is_feature_enabled', { p_key: 'reviews_moderation' });
  const res = enabled
    ? await sb.from('nl_course_reviews').select('id, course_id, rating, title, body, reported, hidden, verified_purchase, helpful_count, created_at').order('reported', { ascending: false }).order('created_at', { ascending: false }).limit(500)
    : { data: [] as unknown[] };
  const data = res.data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="⭐"
        eyebrow="Conteúdo · Reviews"
        title="Moderação de Reviews"
        description="Avaliações de cursos. Oculta, dispensa reports ou elimina avaliações inadequadas."
      />
      {!enabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Funcionalidade desativada. Ativa em{' '}
          <Link href={'/admin/features' as any} className="font-semibold underline">Funcionalidades</Link>.
        </div>
      ) : (
        <ReviewsClient initial={(Array.isArray(data) ? data : []) as never} />
      )}
    </div>
  );
}

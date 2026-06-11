import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
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
    <div>
      <Link href={'/admin' as any} className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Cockpit
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Star className="h-3.5 w-3.5" /> Conteudo · Reviews
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Moderacao de Reviews</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          Avaliacoes de cursos. Oculta, dispensa reports ou elimina avaliacoes inadequadas.
        </p>
      </header>
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

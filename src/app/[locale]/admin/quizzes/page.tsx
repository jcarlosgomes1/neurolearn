import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { QuizzesClient } from './QuizzesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/quizzes');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data: enabled } = await sb.rpc('nl_is_feature_enabled', { p_key: 'quizzes' });
  const res = enabled
    ? await sb.from('nl_quiz_attempts').select('id, course_id, module_index, lesson_index, quiz_kind, question, answer_md, ai_score, ai_max_score, ai_feedback_md, human_validated, status, created_at').order('human_validated', { ascending: true }).order('created_at', { ascending: false }).limit(300)
    : { data: [] as unknown[] };
  const data = res.data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🧪"
        eyebrow="Aprendizagem · Quizzes"
        title="Correção de Quizzes"
        description="Respostas avaliadas por IA, pendentes de validação humana. Aprova ou ajusta a pontuação."
      />
      {!enabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Funcionalidade desativada. Ativa em{' '}
          <Link href={'/admin/features' as any} className="font-semibold underline">Funcionalidades</Link>.
        </div>
      ) : (
        <QuizzesClient initial={(Array.isArray(data) ? data : []) as never} />
      )}
    </div>
  );
}

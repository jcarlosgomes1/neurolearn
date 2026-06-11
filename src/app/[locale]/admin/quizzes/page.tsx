import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { ArrowLeft, GraduationCap } from 'lucide-react';
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
    <div>
      <Link href={'/admin' as any} className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Cockpit
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <GraduationCap className="h-3.5 w-3.5" /> Aprendizagem · Quizzes
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Correcao de Quizzes</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          Respostas avaliadas por IA, pendentes de validacao humana. Aprova ou ajusta a pontuacao.
        </p>
      </header>
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

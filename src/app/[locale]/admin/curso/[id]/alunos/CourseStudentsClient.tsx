'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { ArrowLeft, CheckCircle2, Loader2, ArrowUpRight, Users } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface S { user_id: string; name: string | null; email: string | null; avatar_url: string | null; progress_pct: number | null; completed_at: string | null; enrolled_at: string | null; }
interface Data { ok: boolean; error?: string; course: any; count: number; completed_count: number; students: S[]; }

export function CourseStudentsClient({ courseId }: { courseId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: d, error } = await sb.rpc('nl_admin_course_students', { p_course_id: courseId });
        if (error) throw error;
        if (!d || (d as any).ok === false) setErr((d as any)?.error || 'not_found');
        else setData(d as any);
      } catch (e: any) { setErr(e?.message || 'Erro'); }
      finally { setLoading(false); }
    })();
  }, [courseId]);

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 text-violet-600 mx-auto animate-spin" /></div>;
  if (err || !data) return (
    <div className="max-w-3xl mx-auto p-2">
      <Link href={`/admin/curso/${courseId}/editar` as any} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"><ArrowLeft className="h-4 w-4" /> Editor do curso</Link>
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-sm">Curso não encontrado{err ? ` (${err})` : ''}.</div>
    </div>
  );

  const c = data.course;
  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      <AdminPageHeader
        backHref={`/admin/curso/${courseId}/editar`}
        backLabel="Editor"
        title={c.title}
        description={`${data.count} aluno(s) · ${data.completed_count} concluído(s)`}
        related={[
          { href: '/admin/cursos', label: 'Cursos' },
          ...(c.instructor_id ? [{ href: `/admin/instrutor/${c.instructor_id}`, label: 'Instrutor', emoji: '🎓' }] : []),
        ]}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider inline-flex items-center gap-2 mb-4"><Users className="h-4 w-4 text-blue-600" /> Alunos inscritos</h2>
        {data.students.length === 0 ? <p className="text-sm text-slate-400">Sem alunos inscritos.</p> : (
          <div className="divide-y divide-slate-100">
            {data.students.map((s) => (
              <Link key={s.user_id} href={`/admin/users/${s.user_id}` as any} className="group flex items-center gap-3 py-3 hover:bg-slate-50/60 -mx-2 px-2 rounded-lg transition-colors">
                {s.avatar_url ? <img src={s.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0" /> : <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">{(s.name || s.email || '?').charAt(0).toUpperCase()}</div>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate group-hover:text-violet-700">{s.name || s.email || 'Sem nome'}</div>
                  <div className="text-xs text-slate-400 truncate">{s.email}{s.enrolled_at ? ` · inscrito ${new Date(s.enrolled_at).toLocaleDateString('pt-PT')}` : ''}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full" style={{ width: `${Math.min(100, s.progress_pct || 0)}%` }} /></div>
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right">{s.completed_at ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : `${s.progress_pct || 0}%`}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-violet-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

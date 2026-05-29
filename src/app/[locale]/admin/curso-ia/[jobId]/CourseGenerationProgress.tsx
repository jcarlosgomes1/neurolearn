'use client';

import { useEffect, useState, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Job {
  id: string;
  course_id: string;
  config: any;
  status: 'pending' | 'generating_outline' | 'generating_lessons' | 'completed' | 'failed';
  progress_total: number;
  progress_done: number;
  current_step: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

const STATUS_META: Record<string, { emoji: string; label: string; color: string }> = {
  pending: { emoji: '⏳', label: 'A iniciar', color: 'bg-slate-100 text-slate-700' },
  generating_outline: { emoji: '🧠', label: 'A criar estrutura', color: 'bg-amber-100 text-amber-700' },
  generating_lessons: { emoji: '✍️', label: 'A gerar aulas', color: 'bg-brand-100 text-brand-700' },
  completed: { emoji: '✅', label: 'Concluído', color: 'bg-emerald-100 text-emerald-700' },
  failed: { emoji: '❌', label: 'Falhou', color: 'bg-rose-100 text-rose-700' },
};

export function CourseGenerationProgress({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchStatus() {
    try {
      const sb = createClient();
      const { data: jobData, error: jobErr } = await sb.from('nl_course_generation_jobs').select('*').eq('id', jobId).maybeSingle();
      if (jobErr) throw jobErr;
      if (!jobData) throw new Error('Job não encontrado');
      setJob(jobData as Job);

      if (jobData.course_id) {
        const { data: courseData } = await sb.from('nl_courses').select('id, title, subtitle, emoji, modules, topics').eq('id', jobData.course_id).maybeSingle();
        setCourse(courseData);
      }

      // Stop polling if terminal state
      if ((jobData.status === 'completed' || jobData.status === 'failed') && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        if (jobData.status === 'completed') toast.success('Curso gerado com sucesso! 🎉');
        else toast.error('Geração falhou: ' + (jobData.error_message || 'erro desconhecido'));
      }
    } catch (e: any) {
      setErr(e.message);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err}</p>
        <Link href={'/admin' as any} className="btn-primary mt-6 inline-flex">← Cockpit</Link>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-slate-500 mt-4">A carregar...</p>
      </div>
    );
  }

  const meta = STATUS_META[job.status];
  const pct = job.progress_total > 0 ? Math.round((job.progress_done / job.progress_total) * 100) : 0;
  const isWorking = job.status === 'pending' || job.status === 'generating_outline' || job.status === 'generating_lessons';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 animate-fade-in">
      <div>
        <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">Geração de curso</h1>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${meta.color}`}>{meta.label}</span>
              <p className="text-slate-700 font-medium mt-1">{job.current_step || '...'}</p>
            </div>
          </div>
          {isWorking && <div className="inline-block w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />}
        </div>

        {job.progress_total > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>{job.progress_done} de {job.progress_total} aulas</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {job.status === 'failed' && job.error_message && (
          <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
            <strong>Erro:</strong> {job.error_message}
          </div>
        )}
      </div>

      {/* Config recap */}
      <details className="bg-white rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Configuração desta geração</summary>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div><dt className="text-slate-500">Tópico</dt><dd className="text-slate-900">{job.config.topic}</dd></div>
          <div><dt className="text-slate-500">Idioma</dt><dd className="text-slate-900">{job.config.language?.toUpperCase()}</dd></div>
          <div><dt className="text-slate-500">Nível</dt><dd className="text-slate-900">{job.config.level}</dd></div>
          <div><dt className="text-slate-500">Tom</dt><dd className="text-slate-900">{job.config.tone}</dd></div>
          <div><dt className="text-slate-500">Estrutura</dt><dd className="text-slate-900">{job.config.num_modules} módulos × {job.config.lessons_per_module} aulas</dd></div>
          <div><dt className="text-slate-500">Profundidade</dt><dd className="text-slate-900">{job.config.depth}</dd></div>
        </dl>
      </details>

      {/* Preview do curso à medida que é gerado */}
      {course && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{course.emoji || '📚'}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 truncate">{course.title}</h2>
              {course.subtitle && <p className="text-sm text-slate-500 truncate">{course.subtitle}</p>}
            </div>
          </div>

          {Array.isArray(course.modules) && course.modules.length > 0 && (
            <div className="space-y-3">
              {course.modules.map((mod: any, mi: number) => (
                <div key={mi} className="border border-slate-100 rounded-lg overflow-hidden">
                  <div className="p-3 bg-slate-50 flex items-center gap-2">
                    <span className="text-slate-400 text-xs font-mono">M{mi + 1}</span>
                    <span className="font-medium text-sm text-slate-900 truncate">{mod.title}</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {(mod.lessons || []).map((les: any, li: number) => {
                      const generated = !!(les.content && les.content.p && les.content.p.length > 0);
                      return (
                        <li key={li} className="p-3 flex items-center gap-3 text-sm">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${generated ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{generated ? '✓' : (mi + 1) + '.' + (li + 1)}</span>
                          <span className={`flex-1 min-w-0 truncate ${generated ? 'text-slate-900' : 'text-slate-500'}`}>{les.title}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0">{les.duration_minutes}min</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {job.status === 'completed' && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/admin/curso/${course.id}/editar` as any} className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm">Abrir no editor</Link>
              <Link href={'/admin/cursos' as any} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-lg text-sm">← Todos os cursos</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

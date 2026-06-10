import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { GraduationCap, Clock, Users, BookOpen, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { EnrollPathButton } from './EnrollPathButton';

export const revalidate = 300;

const DIFF_KEY: Record<string, string> = {
  beginner: 'path.diff_beginner',
  intermediate: 'path.diff_intermediate',
  advanced: 'path.diff_advanced',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_learning_path_get_by_slug', { p_slug: slug });
  const path = (data as any)?.path;
  if (!path) return { title: 'Percurso' };
  return {
    title: path.title,
    description: path.subtitle || path.description || '',
  };
}

export default async function LearningPathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_learning_path_get_by_slug', { p_slug: slug });
  if (error || !data) notFound();

  const result = data as any;
  const path = result.path;
  const courses = result.courses || [];
  const isEnrolled = result.is_enrolled;

  if (!path) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href={'/aprender/percursos' as any} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
        <ChevronLeft className="h-4 w-4" /> {t('path.all_paths')}
      </Link>

      <header className="bg-gradient-to-br from-violet-50 via-white to-brand-50 border border-slate-200 rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-5xl">{path.emoji || '🎓'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-semibold ${
                path.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
                path.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>{DIFF_KEY[path.difficulty] ? t(DIFF_KEY[path.difficulty]) : path.difficulty}</span>
              {path.category && <span className="text-[10px] uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">{path.category}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{path.title}</h1>
            {path.subtitle && <p className="text-base text-slate-600 mt-1">{path.subtitle}</p>}
          </div>
        </div>
        {path.description && <p className="text-slate-700 leading-relaxed mb-4">{path.description}</p>}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
          <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {t('bn.courses', { count: courses.length })}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> ~{path.estimated_hours}h</span>
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {t('path.enrolled_count', { count: path.enrollments_count })}</span>
        </div>
        <EnrollPathButton pathId={path.id} isEnrolled={isEnrolled} />
      </header>

      <h2 className="text-lg font-bold text-slate-900 mb-3">{t('path.courses_in')}</h2>
      {courses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
          {t('path.courses_soon')}
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((c: any, idx: number) => (
            <Link key={c.id} href={`/curso/${c.id}` as any}
              className="group bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-brand-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 text-slate-500 font-bold text-sm flex-shrink-0">
                {idx + 1}
              </div>
              <span className="text-2xl">{c.emoji || '📘'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">{c.title}</h3>
                {c.subtitle && <p className="text-xs text-slate-500 truncate">{c.subtitle}</p>}
                <div className="text-[10px] text-slate-400 mt-0.5">{c.level} · {c.duration}</div>
              </div>
              {c.required && <span className="text-[10px] uppercase bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-semibold">{t('path.required')}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { GapsClient } from './GapsClient';

export const dynamic = 'force-dynamic';

export default async function PathGapsPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: path } = await sb.from('nl_learning_paths').select('id, slug, title').eq('id', id).maybeSingle();
  if (!path) notFound();
  const { data: gaps } = await sb.rpc('nl_admin_path_gaps_list', { p_path_id: id });
  const { data: pathCourses } = await sb.from('nl_learning_path_courses')
    .select('course_id, sort_order').eq('path_id', id).order('sort_order');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={{ pathname: '/admin/learning-paths/[id]', params: { id } } as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Voltar ao percurso
      </Link>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="h-3.5 w-3.5" /> Cursos em falta
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{(path as any).title}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Regista cursos que ainda não existem e que este percurso precisa. Aprovas e a plataforma gera o curso completo automaticamente.
        </p>
      </div>
      <GapsClient
        pathId={id}
        gaps={Array.isArray(gaps) ? gaps : []}
        existingCount={Array.isArray(pathCourses) ? pathCourses.length : 0}
      />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ArrowLeft } from 'lucide-react';
import { GapsClient } from './GapsClient';

export const dynamic = 'force-dynamic';

export default async function PathGapsPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const { data: path } = await sb.from('nl_learning_paths').select('id, slug, title').eq('id', id).maybeSingle();
  if (!path) notFound();
  const { data: gaps } = await sb.rpc('nl_admin_path_gaps_list', { p_path_id: id });
  const { data: pathCourses } = await sb.from('nl_learning_path_courses')
    .select('course_id, sort_order').eq('path_id', id).order('sort_order');

  return (
    <div className="">
      <a
        href={`/${locale}/admin/learning-paths/${id}`}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Voltar ao percurso
      </a>
      <AdminPageHeader
        eyebrow="Cursos em falta"
        title={(path as any).title}
        description="Regista cursos que ainda não existem e que este percurso precisa. Aprovas e a plataforma gera o curso completo automaticamente."
      />
      <GapsClient
        pathId={id}
        gaps={Array.isArray(gaps) ? gaps : []}
        existingCount={Array.isArray(pathCourses) ? pathCourses.length : 0}
      />
    </div>
  );
}

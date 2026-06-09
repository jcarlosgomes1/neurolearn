import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { RecursosClient } from './RecursosClient';

export const dynamic = 'force-dynamic';

export default async function CourseResourcesPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: course } = await sb.from('nl_courses').select('id, slug, title, modules').eq('id', id).maybeSingle();
  if (!course) notFound();
  const { data: resources } = await sb.rpc('nl_admin_course_resources_grouped', { p_course_id: id });

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <Link href={{ pathname: '/admin/cursos/[id]', params: { id } } as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {(course as any).title}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <BookOpen className="h-3.5 w-3.5" /> Curso · Recursos
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Recursos por lição</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
          Adiciona repositórios GitHub, notebooks Python, links externos, downloads ou sandboxes a cada lição.
          Os alunos veem-nos no fim da página da lição.
        </p>
      </header>
      <RecursosClient
        courseId={id}
        modules={Array.isArray((course as any).modules) ? (course as any).modules : []}
        initial={Array.isArray(resources) ? resources : []}
      />
    </div>
  );
}

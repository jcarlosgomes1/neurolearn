import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RecursosClient } from './RecursosClient';

export const dynamic = 'force-dynamic';

export default async function CourseResourcesPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: course } = await sb.from('nl_courses').select('id, title, modules').eq('id', id).maybeSingle();
  if (!course) notFound();
  const { data: resources } = await sb.rpc('nl_admin_course_resources_grouped', { p_course_id: id });

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <a href={`/${locale}/admin/cursos/${id}`}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {(course as any).title}
      </a>
      <AdminPageHeader
        eyebrow="Curso · Recursos"
        title="Recursos por lição"
        description="Adiciona repositórios GitHub, notebooks Python, links externos, downloads ou sandboxes a cada lição."
      />
      <RecursosClient
        courseId={id}
        modules={Array.isArray((course as any).modules) ? (course as any).modules : []}
        initial={Array.isArray(resources) ? resources : []}
      />
    </div>
  );
}

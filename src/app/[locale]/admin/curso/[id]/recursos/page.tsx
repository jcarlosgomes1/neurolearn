import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { notFound } from 'next/navigation';
import { RecursosClient } from '../../../cursos/[id]/recursos/RecursosClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: course } = await sb.from('nl_courses').select('id, title, modules').eq('id', id).maybeSingle();
  if (!course) notFound();
  const { data: resources } = await sb.rpc('nl_admin_course_resources_grouped', { p_course_id: id });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader eyebrow="Curso · Recursos" title="Recursos por lição" description="Adiciona repositórios GitHub, notebooks Python, links externos, downloads ou sandboxes a cada lição." />
      <RecursosClient courseId={id} modules={Array.isArray((course as any).modules) ? (course as any).modules : []} initial={Array.isArray(resources) ? resources : []} />
    </div>
  );
}

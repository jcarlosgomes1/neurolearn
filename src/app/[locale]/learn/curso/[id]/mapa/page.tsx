import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { MindMap } from '@/components/shared/MindMap';
import { ScormCourseSection } from '@/components/learn/ScormCourseSection';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

export const metadata = { title: 'Mapa do curso' };

export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations('map');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect_to=/learn/curso/${id}/mapa`);

  const { data, error } = await sb.rpc('nl_course_map_mermaid', { p_course_id: id });
  const r = data as { ok?: boolean; error?: string; title?: string; mermaid?: string } | null;
  if (error || !r?.ok) {
    redirect(r?.error === 'no_access' ? `/${locale}/curso/${id}` : `/${locale}/learn`);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AppPageHeader backHref={`/learn/curso/${id}/aula/0/0`} backLabel={t('back')} title={r?.title || ''} description={t('subtitle')} />
      <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-4 overflow-hidden">
        <MindMap code={r?.mermaid || ''} />
      </div>
      <ScormCourseSection courseId={id} />
    </div>
  );
}

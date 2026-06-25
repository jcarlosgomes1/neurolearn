import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { CourseFeedbackPanel } from '../CourseFeedbackPanel';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { return { title: 'Feedback · NeuroLearn' }; }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: enrollments } = await sb
    .from('nl_enrollments_v2')
    .select('course_id, completed_at, nl_courses(id, title)')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  const completed = (enrollments || []) as any[];

  return (
    <div className="py-8">
      <AppPageHeader  title={t('feedback.page_title')} description={t('feedback.page_sub')} />

      {completed.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">{t('feedback.no_completed')}</div>
      ) : (
        <div className="space-y-3">
          {completed.map((e) => (
            <CourseFeedbackPanel key={e.course_id} courseId={e.course_id} courseTitle={e.nl_courses?.title} />
          ))}
        </div>
      )}
    </div>
  );
}

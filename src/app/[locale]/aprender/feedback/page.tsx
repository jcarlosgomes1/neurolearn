import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { MessageSquareHeart } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <MessageSquareHeart className="h-3.5 w-3.5" /> {t('feedback.title')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('feedback.page_title')}</h1>
        <p className="text-sm text-slate-600 mt-1.5">{t('feedback.page_sub')}</p>
      </header>

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

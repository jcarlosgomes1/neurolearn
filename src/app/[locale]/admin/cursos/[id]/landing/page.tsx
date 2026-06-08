import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, LayoutTemplate } from 'lucide-react';
import { LandingEditorClient } from './LandingEditorClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);

  let result: any;
  try {
    const { data } = await sb.rpc('nl_admin_course_landing_get', { p_course_id: id });
    result = data;
  } catch { notFound(); }
  if (!result?.course) notFound();

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={{ pathname: '/admin/curso/[id]/editar', params: { id } } as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {result.course.emoji || ''} {result.course.title}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-fuchsia-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <LayoutTemplate className="h-3.5 w-3.5" /> {safeT('admin.course_landing.eyebrow', 'Curso · Landing page')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('admin.course_landing.title', 'Landing page do curso')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('admin.course_landing.description', 'Personaliza hero, bullets, testemunhos e FAQ.')}
        </p>
      </header>
      <LandingEditorClient
        courseId={id}
        courseTitle={result.course.title}
        initial={result.landing || {}}
      />
    </div>
  );
}

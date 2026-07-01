import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { GraduationCap, CheckCircle2, Clock, BookOpen, ChevronRight, Route, Building2 } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { RecommendationsPanel } from '../RecommendationsPanel';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Os meus percursos' };

const DIFF_KEY: Record<string, string> = {
  beginner: 'path.diff_beginner',
  intermediate: 'path.diff_intermediate',
  advanced: 'path.diff_advanced',
};

export default async function MyLearningPathsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });

  const { data, error } = await sb.rpc('nl_my_learning_paths');
  const paths = (error || !Array.isArray(data)) ? [] : data;

  const { data: orgRes } = await sb.rpc('nl_my_org_paths');
  const orgPaths = ((orgRes as { paths?: any[] })?.paths) || [];

  // Entrada única "Percursos": sem percursos próprios → catálogo público
  if (paths.length === 0 && orgPaths.length === 0) {
    redirect({ href: '/aprender/percursos', locale });
  }

  return (
    <div>
      <AppPageHeader title={t('path.my_h1')} description={t('path.my_sub')} actions={
        <Link href={'/aprender/percursos' as any}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium">
          <Route className="h-4 w-4" /> {t('path.explore')}
        </Link>
      } />

      <RecommendationsPanel />

      {orgPaths.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-brand-700 mb-1 flex items-center gap-2"><Building2 className="h-4 w-4" /> {t('path.org_assigned_h')}</h2>
          <p className="text-xs text-slate-500 mb-4">{t('path.org_assigned_sub')}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {orgPaths.map((p: any) => {
              const opct = Math.round(Number(p.my_progress || 0));
              return (
                <Link key={`${p.path_id}-${p.org_name}`} href={`/aprender/percursos/${p.slug}` as any}
                  className="group block rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-brand-50/40 p-5 hover:shadow-md hover:border-brand-300 transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl flex-shrink-0">{p.emoji || '\u{1F393}'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 group-hover:text-brand-700 leading-tight">{p.title}</h3>
                        {p.required && <span className="text-[10px] uppercase font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">{t('empresa.paths.required')}</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{t('path.via_org', { org: p.org_name })}</div>
                      <div className="mt-3 h-1.5 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-500 to-brand-500" style={{ width: `${opct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 self-center flex-shrink-0">{opct}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {paths.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('path.empty_h')}</h3>
          <p className="text-sm text-slate-500 mb-4">{t('path.empty_p')}</p>
          <Link href={'/aprender/percursos' as any}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">
            {t('path.empty_cta')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {paths.map((p: any) => {
            const pct = Math.round(Number(p.progress_pct || 0));
            const completed = !!p.completed_at;
            return (
              <Link key={p.path_id} href={`/aprender/percursos/${p.slug}` as any}
                className="group block bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-brand-300 transition-all">
                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">{p.emoji || '🎓'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-brand-700">{p.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {t('bn.courses', { count: p.course_count })}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.estimated_hours}h</span>
                          <span className="capitalize">{DIFF_KEY[p.difficulty] ? t(DIFF_KEY[p.difficulty]) : p.difficulty}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {completed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> {t('path.completed')}
                          </span>
                        ) : (
                          <span className="text-2xl font-bold text-slate-900">{pct}%</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-brand-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-600 transition-colors flex-shrink-0 self-center" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

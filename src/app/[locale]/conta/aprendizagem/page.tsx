import { createClient } from '@/lib/supabase/server';
import { Link, redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import {
  BookOpen, Clock, Trophy, Flame, ArrowRight, PlayCircle, Award,
  GraduationCap, ChevronRight
} from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

export const dynamic = 'force-dynamic';

function fmtMin(n: number): string {
  if (n < 60) return `${n}m`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function MeuAprendizagemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });

  const { data: profile } = await sb.from('nl_profiles').select('name, avatar_url').eq('id', user!.id).maybeSingle();
  const { data, error } = await sb.rpc('nl_my_learning_dashboard');
  const d = (data || {}) as any;
  const stats = d.stats || {};
  const firstName = (profile?.name || user!.email || '').split(' ')[0] || t('learn.hello_fallback');

  return (
    <div className="space-y-8">
      <AppPageHeader
        title={t('learn.greeting', { name: firstName })}
        description={d.next_lesson?.course_title
          ? <>{t('learn.continue_from_pre')}<span className="font-semibold">{d.next_lesson.course_title}</span></>
          : t('learn.ready_prompt')}
        actions={d.next_lesson ? (
          <Link
            href={`/curso/${d.next_lesson.course_id}`}
            className="inline-flex items-center gap-2 bg-brand-600 text-white hover:bg-brand-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            <PlayCircle className="h-4 w-4" /> {t('learn.continue_course')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : undefined}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<BookOpen className="h-4 w-4" />} value={stats.courses_enrolled || 0} label={t('learn.stat_courses')} />
        <StatCard icon={<PlayCircle className="h-4 w-4" />} value={stats.lessons_completed || 0} label={t('learn.stat_lessons')} />
        <StatCard icon={<Clock className="h-4 w-4" />} value={fmtMin(stats.minutes_learned || 0)} label={t('learn.stat_time')} />
        <StatCard icon={<Flame className="h-4 w-4" />} value={stats.streak_days || 0} label={t('learn.stat_streak', { days: stats.streak_days || 0 })} highlight={stats.streak_days >= 3} />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-900">
          {t('learn.load_error', { msg: error.message })}
        </div>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{t('learn.in_progress')}</h2>
          <Link href={'/learn' as any} className="text-xs text-brand-600 hover:underline font-medium">
            {t('learn.all_courses')} →
          </Link>
        </div>
        {Array.isArray(d.in_progress) && d.in_progress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {d.in_progress.map((c: any) => (
              <Link
                key={c.id}
                href={`/curso/${c.id}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-brand-200 transition-all hover:-translate-y-0.5">
                <div className="h-32 bg-gradient-to-br from-brand-500 to-brand-600 relative overflow-hidden">
                  {c.cover_url && (
                    <img src={c.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-3 text-3xl drop-shadow-lg">{c.emoji || '📘'}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 mb-1.5">{c.title}</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{t('learn.pct_complete', { pct: Math.round(Number(c.progress_pct || 0)) })}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Number(c.progress_pct || 0))}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyHint
            icon={<BookOpen className="h-6 w-6" />}
            title={t('learn.empty_courses_title')}
            hint={t('learn.empty_courses_hint')}
            cta={{ href: '/cursos', label: t('learn.see_courses') }}
          />
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-brand-500" /> {t('learn.paths_title')}
          </h2>
          <Link href={'/aprender/percursos' as any} className="text-xs text-brand-600 hover:underline font-medium">
            {t('learn.explore_paths')} →
          </Link>
        </div>
        {Array.isArray(d.paths) && d.paths.length > 0 ? (
          <div className="space-y-2">
            {d.paths.map((p: any) => (
              <Link
                key={p.id}
                href={`/aprender/percursos/${p.slug}`}
                className="flex items-center gap-4 bg-white border border-slate-200 hover:border-brand-200 rounded-xl p-4 group transition-all">
                <div className="text-3xl bg-gradient-to-br from-brand-100 to-brand-100 h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0">
                  {p.emoji || '🎓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-brand-700 transition-colors">{p.title}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>{t('learn.pct_complete', { pct: Math.round(Number(p.progress_pct || 0)) })}</span>
                    <span>·</span>
                    <span>{t('learn.est_hours', { h: p.estimated_hours || 0 })}</span>
                  </div>
                  <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-500"
                      style={{ width: `${Math.min(100, Number(p.progress_pct || 0))}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyHint
            icon={<GraduationCap className="h-6 w-6" />}
            title={t('learn.empty_paths_title')}
            hint={t('learn.empty_paths_hint')}
            cta={{ href: '/aprender/percursos', label: t('learn.see_paths') }}
          />
        )}
      </section>

      {Array.isArray(d.recent_certificates) && d.recent_certificates.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> {t('learn.recent_certs')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.recent_certificates.map((c: any) => (
              <div key={c.id} className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
                  <Award className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{t('learn.certificate')}</div>
                  <div className="text-xs text-slate-600 font-mono truncate">{c.verification_code}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, highlight }: { icon: React.ReactNode; value: any; label: string; highlight?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl px-4 py-3 ${highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wider font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function EmptyHint({ icon, title, hint, cta }: { icon: React.ReactNode; title: string; hint: string; cta: { href: string; label: string } }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 text-sm mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{hint}</p>
      <Link href={cta.href as any} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg">
        {cta.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { Stat } from '@/components/shared/Stat';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents, relTime } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import { Plus, Briefcase, Inbox, TrendingUp } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { InstructorQuestions } from '@/components/teach/InstructorQuestions';

export function TeachDashboard() {
  const t = useTranslations();
  const [dash, setDash] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    callAgentOps<{ dashboard: any }>('teach_dashboard')
      .then((r) => setDash(r.dashboard))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) {
    const friendly =
      err === 'no_instructor_record' ? t('teach.err_no_instructor') :
      err === 'instructor_not_approved' ? t('teach.err_not_approved') :
      err === 'not_authenticated' ? t('teach.err_signin') : err;
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-4">🎓</div>
        <p className="text-slate-700 font-medium">{friendly}</p>
        <Link href={'/' as any} className="btn-primary mt-6 inline-flex">{t('teach.btn_back_home')}</Link>
      </div>
    );
  }
  if (!dash) return <DashboardSkeleton stats={5} />;

  const s = dash.stats;
  return (
    <div className="px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <AppPageHeader title={t('teach.title')} description={t('teach.subtitle')} actions={
        <Link href={'/teach/novo' as any} className="btn-primary inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> {t('teach.btn_new_course')}
        </Link>
      } />

      <div className="flex flex-wrap gap-2">
        <Link href={'/teach/servicos' as any}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-sm font-medium transition-colors">
          <Briefcase className="h-4 w-4" /> {t('teach.nav_corporate')}
        </Link>
        <Link href={'/teach/pedidos' as any}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-sm font-medium transition-colors">
          <Inbox className="h-4 w-4" /> {t('teach.nav_inquiries')}
        </Link>
        <Link href={'/teach/b2b' as any}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-sm font-medium transition-colors">
          <TrendingUp className="h-4 w-4" /> {t('teach.nav_earnings')}
          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">{t('teach.badge_new')}</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat icon="📚" label={t('teach.stat_courses')} value={`${s.courses_published}/${s.courses_total}`} accent="brand" href="#meus-cursos" />
        <Stat icon="👥" label={t('teach.stat_students')} value={s.total_students} accent="purple" href="#meus-cursos" />
        <Stat icon="💰" label={t('teach.stat_revenue')} value={fmtCents(s.total_earnings_cents)} accent="emerald" href="#meus-cursos" />
        <Stat icon="⏱" label={t('teach.stat_available')} value={fmtCents(s.available_payout_cents)} accent="amber" href="#meus-cursos" />
        <Stat icon="★" label={t('teach.stat_rating')} value={s.avg_rating ?? '—'} accent="rose" href="#meus-cursos" />
      </div>

      <section id="meus-cursos" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">{t('teach.my_courses')}</h2>
        {dash.my_courses.length === 0 ? (
          <div className="text-center py-6"><p className="text-sm text-slate-500 mb-3">{t('teach.no_courses')}</p><Link href={'/teach/novo' as any} className="btn-primary inline-flex">{t('teach.btn_first_course')}</Link></div>
        ) : (
          <div className="space-y-2">
            {dash.my_courses.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{c.emoji || '📘'}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{c.title}</div>
                    <div className="text-xs text-slate-500">{t('teach.students_count', { n: c.enrollments_count || 0 })} · {c.published ? t('teach.published') : t('teach.draft')}</div>
                  </div>
                </div>
                {c.rating_avg && <span className="text-sm text-amber-600 flex-shrink-0 ml-3">★ {Number(c.rating_avg).toFixed(1)}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <InstructorQuestions />

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t('teach.payouts_title')}</h2>
          {dash.recent_payouts.length === 0 ? (
            <p className="text-sm text-slate-500">{t('teach.no_payouts')}</p>
          ) : (
            <ul className="space-y-2">
              {dash.recent_payouts.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-slate-500 truncate">{p.reference_number || '#' + String(p.id).slice(0, 8)}</div>
                    <div className="text-xs text-slate-400">{relTime(p.created_at)}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-semibold tabular-nums">{fmtCents(p.amount_cents)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t('teach.reviews_title')}</h2>
          {dash.recent_reviews.length === 0 ? (
            <p className="text-sm text-slate-500">{t('teach.no_reviews')}</p>
          ) : (
            <ul className="space-y-3">
              {dash.recent_reviews.slice(0, 5).map((r: any) => (
                <li key={r.id} className="text-sm py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 truncate">{r.nl_courses?.title || t('teach.course_fallback')}</span>
                    <span className="text-amber-500 flex-shrink-0">{'★'.repeat(r.rating || 0)}</span>
                  </div>
                  {r.body && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{r.body}</p>}
                  <div className="text-xs text-slate-400 mt-1">{relTime(r.created_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

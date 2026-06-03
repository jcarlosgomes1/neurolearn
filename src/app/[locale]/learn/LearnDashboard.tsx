'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { Stat } from '@/components/shared/Stat';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { relTime } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';

interface Cert {
  id: string;
  course_title: string;
  certificate_number: string;
  verification_code: string;
  issued_at: string;
  course_level?: string;
  skills?: string[];
}

interface Dash {
  stats: { enrollments_total: number; courses_completed: number; courses_in_progress: number; certificates_earned: number; unread_notifications: number };
  my_courses: any[];
  recent_notifications: any[];
  recent_certificates: any[];
}

export function LearnDashboard() {
  const t = useTranslations();
  const [dash, setDash] = useState<Dash | null>(null);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      callAgentOps<{ dashboard: Dash }>('my_dashboard'),
      callAgentOps<{ certificates: Cert[] }>('my_certificates').catch(() => ({ certificates: [] })),
    ])
      .then(([dashRes, certsRes]) => {
        setDash(dashRes.dashboard);
        setCerts(certsRes.certificates || []);
      })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">{t('learn.err_load')}</p>
        <p className="text-sm text-slate-400 mt-2">{err === 'not_authenticated' ? t('learn.err_signin') : err}</p>
        <Link href={'/login' as any} className="btn-primary mt-4 inline-flex">{t('learn.btn_signin')}</Link>
      </div>
    );
  }
  if (!dash) return <DashboardSkeleton stats={5} />;

  const s = dash.stats;
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('learn.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('learn.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat icon="📖" label={t('learn.stat_courses')} value={s.enrollments_total} accent="brand" href="#meus-cursos" />
        <Stat icon="⏳" label={t('learn.stat_progress')} value={s.courses_in_progress} accent="amber" href="#meus-cursos" />
        <Stat icon="✅" label={t('learn.stat_done')} value={s.courses_completed} accent="emerald" href="#meus-cursos" />
        <Stat icon="🏆" label={t('learn.stat_certs')} value={certs.length} accent="purple" href="#certificados" />
        <Stat icon="🔔" label={t('learn.stat_unread')} value={s.unread_notifications} accent="rose" href="#meus-cursos" />
      </div>

      <section id="meus-cursos" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">{t('learn.my_courses')}</h2>
        {dash.my_courses.length === 0 ? (
          <p className="text-sm text-slate-500">{t('learn.no_courses')} <Link href={'/cursos' as any} className="text-brand-600 hover:underline">{t('learn.explore_catalog')}</Link></p>
        ) : (
          <div className="space-y-3">
            {dash.my_courses.map((e) => (
              <Link key={e.id} href={`/learn/curso/${e.course_id}/aula/0/0` as any} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-brand-200 transition-all active:scale-[0.99] touch-manipulation">
                <div className="text-3xl flex-shrink-0">{e.nl_courses?.emoji || '📚'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{e.nl_courses?.title || t('learn.course_fallback')}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-600 transition-all" style={{ width: `${e.progress_pct || 0}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums">{Math.round(e.progress_pct || 0)}%</span>
                  </div>
                </div>
                {e.completed_at && <span className="text-emerald-600 text-xl">✓</span>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t('learn.notifications')}</h2>
          {dash.recent_notifications.length === 0 ? (
            <p className="text-sm text-slate-500">{t('learn.no_notifications')}</p>
          ) : (
            <ul className="space-y-3">
              {dash.recent_notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="text-sm flex items-start gap-2">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read_at ? 'bg-slate-300' : 'bg-brand-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={n.read_at ? 'text-slate-500' : 'text-slate-900 font-medium'}>{n.title}</div>
                    {n.message && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>}
                    <div className="text-xs text-slate-400 mt-1">{relTime(n.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="certificados" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t('cert.my_certs_title')}</h2>
          {certs.length === 0 ? (
            <p className="text-sm text-slate-500">{t('cert.my_certs_empty')}</p>
          ) : (
            <ul className="space-y-3">
              {certs.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 truncate">{c.course_title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-purple-700 font-mono">{c.certificate_number}</span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-[10px] text-slate-500">{relTime(c.issued_at)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/certificate/${c.verification_code}` as any}
                    className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 flex-shrink-0 font-medium"
                  >
                    {t('cert.view')}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

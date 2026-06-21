'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { Stat } from '@/components/shared/Stat';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents, relTime } from '@/lib/utils/cn';
import { ArrowLeft } from 'lucide-react';

export function AdminInstructorDetail({ instructorId, embedded = false }: { instructorId: string; embedded?: boolean }) {
  const t = useTranslations('instr_detail');
  const [dash, setDash] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    callAgentOps<{ dashboard: any }>('admin_instructor_detail', { instructor_id: instructorId })
      .then((r) => setDash(r.dashboard))
      .catch((e) => setErr(e.message));
  }, [instructorId]);

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err === 'admin_required' || err === 'unauthorized' ? t('err_admin') : err === 'not_authenticated' ? t('err_auth') : err}</p>
        <Link href={'/admin/instrutores' as any} className="btn-primary mt-6 inline-flex">{t('back_simple')}</Link>
      </div>
    );
  }
  if (!dash) return <DashboardSkeleton stats={5} />;

  const s = dash.stats;
  const inst = dash.instructor;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {!embedded && (<div>
        <Link href={'/admin/instrutores' as any} className="group inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {t('back_all')}
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Link href={'/admin/instrutores' as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 hover:ring-violet-200 transition-colors"><span className="text-sm leading-none">👨‍🏫</span> Instrutores</Link>
          <Link href={'/admin/candidaturas' as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 hover:ring-violet-200 transition-colors"><span className="text-sm leading-none">🎓</span> Candidaturas</Link>
          <Link href={'/admin/cursos' as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 hover:ring-violet-200 transition-colors"><span className="text-sm leading-none">📚</span> Cursos</Link>
          <Link href={`/admin/users/${instructorId}` as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 hover:ring-violet-200 transition-colors"><span className="text-sm leading-none">👤</span> Perfil</Link>
        </div>
        <div className="flex items-center gap-3 mt-3">
          {inst && (inst.avatar_url || inst.profile_picture_url) ? (
            <img src={inst.avatar_url || inst.profile_picture_url} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">{(inst?.display_name || '?')[0]?.toUpperCase()}</div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{inst?.display_name || t('fallback_title')}</h1>
            <p className="text-slate-500 text-sm">{t('admin_view', { s: inst?.status || '' })}</p>
          </div>
        </div>
      </div>)}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat icon="📚" label={t('courses')} value={`${s.courses_published}/${s.courses_total}`} accent="brand" />
        <Stat icon="👥" label={t('students')} value={s.total_students} accent="purple" />
        <Stat icon="💰" label={t('revenue')} value={fmtCents(s.total_earnings_cents)} accent="emerald" />
        <Stat icon="⏱" label={t('available')} value={fmtCents(s.available_payout_cents)} accent="amber" />
        <Stat icon="★" label={t('rating')} value={s.avg_rating ?? '—'} accent="rose" />
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">{t('my_courses')}</h2>
        {dash.my_courses.length === 0 ? (
          <p className="text-sm text-slate-500">{t('no_courses')}</p>
        ) : (
          <div className="space-y-2">
            {dash.my_courses.map((c: any) => (
              <Link key={c.id} href={`/admin/curso/${c.id}/editar` as any} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{c.emoji || '📘'}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{c.title}</div>
                    <div className="text-xs text-slate-500">{t('enrollments', { n: c.enrollments_count || 0 })} · {c.published ? t('published') : t('draft')}</div>
                  </div>
                </div>
                {c.rating_avg && <span className="text-sm text-amber-600 flex-shrink-0 ml-3">★ {Number(c.rating_avg).toFixed(1)}</span>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t('payouts')}</h2>
          {dash.recent_payouts.length === 0 ? (
            <p className="text-sm text-slate-500">{t('no_payouts')}</p>
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
          <h2 className="font-semibold text-slate-900 mb-4">{t('reviews')}</h2>
          {dash.recent_reviews.length === 0 ? (
            <p className="text-sm text-slate-500">{t('no_reviews')}</p>
          ) : (
            <ul className="space-y-3">
              {dash.recent_reviews.slice(0, 6).map((r: any) => (
                <li key={r.id} className="text-sm py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 truncate">{r.nl_courses?.title || t('fallback_course')}</span>
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { relTime } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { notificationHref } from '@/lib/notifications/href';
import { LearnerJourney, type JourneyData } from '@/components/learn/LearnerJourney';

interface Cert {
  id: string;
  course_title: string;
  certificate_number: string;
  verification_code: string;
  issued_at: string;
}
interface Notif { id: string; title: string; message?: string; read_at?: string | null; created_at: string }

const PLATFORM_BRAND = '#6366f1';

export function LearnDashboard() {
  const t = useTranslations();
  const [data, setData] = useState<JourneyData | null>(null);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data: d, error } = await sb.rpc('nl_my_academy_home');
      if (error) throw error;
      const r = d as { ok?: boolean; error?: string; gam: JourneyData['gam']; challenges?: { challenges: JourneyData['challenges'] }; leaderboard?: { leaderboard: JourneyData['leaderboard']['rows']; my_rank: number | null }; skills: JourneyData['skills']; continue: JourneyData['continue']; enrolled: JourneyData['courses']; available: JourneyData['discover'] };
      if (!r?.ok) { setErr(r?.error || 'error'); return; }
      setData({
        gam: r.gam,
        challenges: r.challenges?.challenges || [],
        leaderboard: { rows: r.leaderboard?.leaderboard || [], my_rank: r.leaderboard?.my_rank ?? null },
        skills: r.skills || [],
        continue: r.continue,
        courses: r.enrolled || [],
        discover: r.available || [],
      });
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); }
  }, []);

  useEffect(() => {
    load();
    callAgentOps<{ certificates: Cert[] }>('my_certificates').then((c) => setCerts(c.certificates || [])).catch(() => {});
    callAgentOps<{ dashboard: { recent_notifications: Notif[] } }>('my_dashboard').then((d) => setNotifs(d.dashboard?.recent_notifications || [])).catch(() => {});
  }, [load]);

  async function claim(code: string) {
    setClaiming(code);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_gam_challenge_claim', { p_code: code });
      if (error) throw error;
      toast.success(safeT('academy.learn.claimed_toast', 'Recompensa resgatada!'));
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
    finally { setClaiming(null); }
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">{t('learn.err_load')}</p>
        <p className="text-sm text-slate-400 mt-2">{err === 'not_authenticated' ? t('learn.err_signin') : err}</p>
        <Link href={'/login' as never} className="btn-primary mt-4 inline-flex">{t('learn.btn_signin')}</Link>
      </div>
    );
  }
  if (!data) return <DashboardSkeleton stats={5} />;

  return (
    <div className="animate-fade-in">
      <LearnerJourney
        data={data}
        brand={PLATFORM_BRAND}
        title={safeT('learn.title', 'A minha aprendizagem')}
        eyebrow={safeT('academy.learn.eyebrow_platform', 'A minha jornada')}
        onClaim={claim}
        claimingCode={claiming}
      />

      {/* Extras B2C: notificações + certificados */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">{t('learn.notifications')}</h2>
            {notifs.length === 0 ? (
              <p className="text-sm text-slate-500">{t('learn.no_notifications')}</p>
            ) : (
              <ul className="space-y-3">
                {notifs.slice(0, 5).map((n) => {
                  const href = notificationHref(n);
                  const inner = (
                    <>
                      <div className={`break-words ${n.read_at ? 'text-slate-500' : 'text-slate-900 font-medium'}`}>{n.title}</div>
                      {n.message && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>}
                      <div className="text-xs text-slate-400 mt-1">{relTime(n.created_at)}</div>
                    </>
                  );
                  return (
                    <li key={n.id} className="text-sm flex items-start gap-2">
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read_at ? 'bg-slate-300' : 'bg-brand-500'}`} />
                      {href ? (
                        <Link href={href as never} className="flex-1 min-w-0 -m-1 p-1 rounded-lg hover:bg-slate-50 transition-colors active:scale-[0.99] touch-manipulation">{inner}</Link>
                      ) : (
                        <div className="flex-1 min-w-0">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section id="certificados" className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 p-5">
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
                    <Link href={`/certificate/${c.verification_code}` as never} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 flex-shrink-0 font-medium">
                      {t('cert.view')}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

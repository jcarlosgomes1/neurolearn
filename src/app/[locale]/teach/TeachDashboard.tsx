'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { Stat } from '@/components/shared/Stat';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents, relTime } from '@/lib/utils/cn';

export function TeachDashboard() {
  const [dash, setDash] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    callAgentOps<{ dashboard: any }>('teach_dashboard')
      .then((r) => setDash(r.dashboard))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) {
    const friendly =
      err === 'no_instructor_record' ? 'Ainda não és instrutor. Submete uma candidatura para começar a ensinar.' :
      err === 'instructor_not_approved' ? 'A tua candidatura a instrutor está a ser revista.' :
      err === 'not_authenticated' ? 'Inicia sessão primeiro.' : err;
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🎓</div>
        <p className="text-slate-700 font-medium">{friendly}</p>
        <Link href={'/' as any} className="btn-primary mt-6 inline-flex">Voltar ao início</Link>
      </div>
    );
  }
  if (!dash) return <DashboardSkeleton stats={5} />;

  const s = dash.stats;
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel Instrutor</h1>
          <p className="text-slate-500 text-sm mt-1">Gestão dos teus cursos e receitas</p>
        </div>
        <Link href={'/teach/novo' as any} className="btn-primary">+ Criar curso</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat icon="📚" label="Cursos" value={`${s.courses_published}/${s.courses_total}`} accent="brand" href="#meus-cursos" />
        <Stat icon="👥" label="Alunos" value={s.total_students} accent="purple" href="#meus-cursos" />
        <Stat icon="💰" label="Receita" value={fmtCents(s.total_earnings_cents)} accent="emerald" href="#meus-cursos" />
        <Stat icon="⏱" label="Disponível" value={fmtCents(s.available_payout_cents)} accent="amber" href="#meus-cursos" />
        <Stat icon="★" label="Rating" value={s.avg_rating ?? '—'} accent="rose" href="#meus-cursos" />
      </div>

      <section id="meus-cursos" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Os meus cursos</h2>
        {dash.my_courses.length === 0 ? (
          <div className="text-center py-6"><p className="text-sm text-slate-500 mb-3">Sem cursos ainda.</p><Link href={'/teach/novo' as any} className="btn-primary inline-flex">+ Criar o meu primeiro curso</Link></div>
        ) : (
          <div className="space-y-2">
            {dash.my_courses.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{c.emoji || '📘'}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.enrollments_count || 0} alunos · {c.published ? '✅ Publicado' : '📝 Rascunho'}</div>
                  </div>
                </div>
                {c.rating_avg && <span className="text-sm text-amber-600 flex-shrink-0 ml-3">★ {Number(c.rating_avg).toFixed(1)}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Últimos payouts</h2>
          {dash.recent_payouts.length === 0 ? (
            <p className="text-sm text-slate-500">Sem payouts ainda.</p>
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
          <h2 className="font-semibold text-slate-900 mb-4">Reviews recentes</h2>
          {dash.recent_reviews.length === 0 ? (
            <p className="text-sm text-slate-500">Sem reviews ainda.</p>
          ) : (
            <ul className="space-y-3">
              {dash.recent_reviews.slice(0, 5).map((r: any) => (
                <li key={r.id} className="text-sm py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 truncate">{r.nl_courses?.title || 'Curso'}</span>
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

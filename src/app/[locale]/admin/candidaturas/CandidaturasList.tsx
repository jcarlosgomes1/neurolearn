'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Application {
  id: string;
  email: string;
  full_name: string;
  country: string | null;
  city: string | null;
  job_title: string | null;
  current_company: string | null;
  years_experience: number | null;
  expertise: string[] | null;
  linkedin_url: string | null;
  website_url: string | null;
  github_url: string | null;
  preferred_lang: string | null;
  proposed_course_title: string | null;
  proposed_course_description: string | null;
  proposed_course_format: string | null;
  proposed_course_language: string | null;
  proposed_target_audience: string | null;
  proposed_course_outline: string | null;
  proposed_course_duration: string | null;
  proposed_course_price_eur: number | null;
  demo_video_url: string | null;
  sample_lesson_url: string | null;
  portfolio_links: string | null;
  references_text: string | null;
  teaching_experience: string | null;
  ai_score_total: number | null;
  ai_score_credibility: number | null;
  ai_score_pedagogy: number | null;
  ai_score_differentiation: number | null;
  ai_score_format: number | null;
  ai_score_language_quality: number | null;
  ai_summary: string | null;
  ai_red_flags: string[] | null;
  ai_strengths: string[] | null;
  ai_processed_at: string | null;
  status: string;
  admin_notes: string | null;
  applied_at: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Submetida', color: 'bg-slate-100 text-slate-700' },
  screening_passed: { label: 'IA aprovou', color: 'bg-blue-100 text-blue-700' },
  shortlisted: { label: 'Shortlist', color: 'bg-purple-100 text-purple-700' },
  under_review: { label: 'Em revisão', color: 'bg-amber-100 text-amber-800' },
  interview_scheduled: { label: 'Entrevista', color: 'bg-cyan-100 text-cyan-800' },
  waitlisted: { label: 'Lista de espera', color: 'bg-yellow-100 text-yellow-800' },
  auto_rejected: { label: 'IA rejeitou', color: 'bg-rose-50 text-rose-700' },
  approved: { label: '✓ Aprovado', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '✗ Rejeitado', color: 'bg-rose-100 text-rose-700' },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const v = score ?? 0;
  const color = v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{v}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function CandidaturasList() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Application | null>(null);

  async function load() {
    setLoading(true);
    const sb = createClient();
    const { data, error } = await sb.from('nl_instructor_applications')
      .select('*').order('applied_at', { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as Application[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter);
  const counts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
      <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">🎓 Candidaturas a instrutor</h1>
          <p className="text-sm text-slate-500 mt-1">{apps.length} candidaturas no total · IA faz screening automático.</p>
        </div>
        <button onClick={load} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg">↻ Recarregar</button>
      </div>

      {/* Filtros */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {[
          { v: 'all', label: 'Todas', count: apps.length },
          { v: 'submitted', label: 'Novas', count: counts.submitted || 0 },
          { v: 'shortlisted', label: 'Shortlist', count: counts.shortlisted || 0 },
          { v: 'screening_passed', label: 'IA aprovou', count: counts.screening_passed || 0 },
          { v: 'under_review', label: 'Em revisão', count: counts.under_review || 0 },
          { v: 'auto_rejected', label: 'IA rejeitou', count: counts.auto_rejected || 0 },
          { v: 'approved', label: 'Aprovados', count: counts.approved || 0 },
          { v: 'rejected', label: 'Rejeitados', count: counts.rejected || 0 },
        ].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>{f.label} <span className="opacity-60 tabular-nums">{f.count}</span></button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 mt-5">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-700 font-medium">{filter === 'all' ? 'Ainda não há candidaturas.' : 'Sem candidaturas neste filtro.'}</p>
          <p className="text-sm text-slate-500 mt-1">Partilha o link <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/candidatar</code> para começar a receber.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {filtered.map((app) => {
            const status = STATUS_LABEL[app.status] || { label: app.status, color: 'bg-slate-100' };
            const scoreColor = (app.ai_score_total ?? 0) >= 80 ? 'text-emerald-600' : (app.ai_score_total ?? 0) >= 60 ? 'text-amber-600' : 'text-rose-600';
            return (
              <button key={app.id} onClick={() => setSelected(app)}
                className="bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md rounded-xl p-4 sm:p-5 text-left transition-all">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-base sm:text-lg">{app.full_name}</h3>
                      <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{app.job_title}{app.current_company && ` · ${app.current_company}`}</p>
                    <p className="text-sm text-slate-700 mt-2 font-medium">"{app.proposed_course_title}"</p>
                    <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span>📅 {fmtDate(app.applied_at)}</span>
                      {app.country && <span>📍 {app.city ? `${app.city}, ` : ''}{app.country}</span>}
                      {app.years_experience && <span>💼 {app.years_experience} anos</span>}
                      {app.expertise && app.expertise.length > 0 && <span>🎯 {app.expertise.slice(0, 2).join(', ')}{app.expertise.length > 2 && '...'}</span>}
                    </div>
                  </div>
                  {app.ai_score_total !== null && (
                    <div className="flex-shrink-0 text-right">
                      <div className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{app.ai_score_total}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Score IA</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de detalhe */}
      {selected && <DetailModal app={selected} onClose={() => setSelected(null)} onReload={load} />}
    </div>
  );
}

function DetailModal({ app, onClose, onReload }: { app: Application; onClose: () => void; onReload: () => void }) {
  const [action, setAction] = useState<'idle' | 'approving' | 'rejecting' | 'rescoring'>('idle');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [revenueShare, setRevenueShare] = useState(50);

  async function api(actionName: string, body: Record<string, unknown> = {}) {
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { toast.error('Sessão expirou'); return null; }
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/instructor-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: actionName, application_id: app.id, ...body }),
    });
    return resp.json();
  }

  async function approve() {
    if (action !== 'idle') return;
    setAction('approving');
    const r = await api('approve', { revenue_share_pct: revenueShare });
    if (r?.ok) { toast.success('Aprovado! Email com password enviado.'); onClose(); onReload(); }
    else { toast.error(r?.error || 'Falha'); setAction('idle'); }
  }

  async function reject() {
    if (action !== 'idle') return;
    if (!showRejectInput) { setShowRejectInput(true); return; }
    setAction('rejecting');
    const r = await api('reject', { decision_reason: rejectReason });
    if (r?.ok) { toast.success('Rejeitado. Email enviado.'); onClose(); onReload(); }
    else { toast.error(r?.error || 'Falha'); setAction('idle'); }
  }

  async function rescore() {
    if (action !== 'idle') return;
    setAction('rescoring');
    const r = await api('rescore');
    if (r?.ok) { toast.success('Score recalculado'); onReload(); }
    else { toast.error(r?.error || 'Falha'); }
    setAction('idle');
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-lg sm:text-xl truncate">{app.full_name}</h2>
            <p className="text-xs text-slate-500">{app.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-3xl leading-none w-9 h-9 flex items-center justify-center flex-shrink-0">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Score AI */}
          {app.ai_score_total !== null && (
            <section className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">🤖 Análise da IA</h3>
                  <p className="text-xs text-slate-500">{app.ai_processed_at && `Processada em ${fmtDate(app.ai_processed_at)}`}</p>
                </div>
                <button onClick={rescore} disabled={action !== 'idle'} className="text-xs bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg disabled:opacity-50">↻ Recalcular</button>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <div className={`text-5xl font-bold tabular-nums ${(app.ai_score_total ?? 0) >= 80 ? 'text-emerald-600' : (app.ai_score_total ?? 0) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{app.ai_score_total}</div>
                  <div className="text-xs text-slate-500 mt-1">de 100</div>
                </div>
                <div className="flex-1 min-w-[200px] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ScoreBar label="Credibilidade" score={app.ai_score_credibility} />
                  <ScoreBar label="Pedagogia" score={app.ai_score_pedagogy} />
                  <ScoreBar label="Diferenciação" score={app.ai_score_differentiation} />
                  <ScoreBar label="Formato" score={app.ai_score_format} />
                  <ScoreBar label="Qualidade língua" score={app.ai_score_language_quality} />
                </div>
              </div>
              {app.ai_summary && (
                <p className="mt-4 text-sm text-slate-700 italic border-l-2 border-slate-200 pl-3">"{app.ai_summary}"</p>
              )}
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {app.ai_strengths && app.ai_strengths.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">✓ Pontos fortes</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {app.ai_strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">+</span>{s}</li>)}
                    </ul>
                  </div>
                )}
                {app.ai_red_flags && app.ai_red_flags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">⚠ Pontos de atenção</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {app.ai_red_flags.map((s, i) => <li key={i} className="flex gap-2"><span className="text-rose-500 flex-shrink-0">!</span>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Perfil */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Perfil</h3>
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Row label="Função" value={`${app.job_title || '—'}${app.current_company ? ` @ ${app.current_company}` : ''}`} />
              <Row label="Localização" value={`${app.city || ''}${app.city && app.country ? ', ' : ''}${app.country || '—'}`} />
              <Row label="Experiência" value={app.years_experience ? `${app.years_experience} anos` : '—'} />
              <Row label="Idioma preferido" value={app.preferred_lang || '—'} />
              <Row label="LinkedIn" value={app.linkedin_url ? <a href={app.linkedin_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">Ver perfil ↗</a> : '—'} />
              <Row label="Website" value={app.website_url ? <a href={app.website_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{app.website_url} ↗</a> : '—'} />
              <Row label="GitHub" value={app.github_url ? <a href={app.github_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{app.github_url} ↗</a> : '—'} />
              <Row label="Especialidades" value={app.expertise?.join(', ') || '—'} />
            </dl>
            {app.teaching_experience && (
              <div className="mt-3 bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Experiência de ensino</div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{app.teaching_experience}</p>
              </div>
            )}
          </section>

          {/* Curso proposto */}
          <section className="bg-brand-50/40 border border-brand-100 rounded-xl p-5">
            <h3 className="text-sm font-bold text-brand-900 mb-3 uppercase tracking-wider">📚 Curso proposto</h3>
            <h4 className="font-bold text-slate-900 text-base mb-2">{app.proposed_course_title}</h4>
            {app.proposed_course_description && (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">{app.proposed_course_description}</p>
            )}
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Row label="Formato" value={app.proposed_course_format || '—'} />
              <Row label="Idioma" value={app.proposed_course_language || '—'} />
              <Row label="Duração" value={app.proposed_course_duration || '—'} />
              <Row label="Preço sugerido" value={app.proposed_course_price_eur ? `${app.proposed_course_price_eur}€` : '—'} />
              <Row label="Público-alvo" value={app.proposed_target_audience || '—'} />
            </dl>
            {app.proposed_course_outline && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-brand-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Estrutura proposta</div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{app.proposed_course_outline}</p>
              </div>
            )}
          </section>

          {/* Materiais */}
          {(app.demo_video_url || app.sample_lesson_url || app.portfolio_links || app.references_text) && (
            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Materiais</h3>
              <dl className="text-sm space-y-2">
                {app.demo_video_url && <Row label="Vídeo demo" value={<a href={app.demo_video_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{app.demo_video_url} ↗</a>} />}
                {app.sample_lesson_url && <Row label="Aula amostra" value={<a href={app.sample_lesson_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{app.sample_lesson_url} ↗</a>} />}
                {app.portfolio_links && <Row label="Portfólio" value={<span className="whitespace-pre-wrap text-sm">{app.portfolio_links}</span>} />}
                {app.references_text && <Row label="Referências" value={<span className="whitespace-pre-wrap text-sm">{app.references_text}</span>} />}
              </dl>
            </section>
          )}
        </div>

        {/* Action bar */}
        {!['approved', 'rejected'].includes(app.status) && (
          <div className="border-t border-slate-200 p-5 bg-slate-50 flex-shrink-0 space-y-3">
            {showRejectInput && (
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Razão (enviada por email)</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input mt-1 min-h-[80px]" placeholder="Ex: A proposta sobrepõe-se a cursos que já temos. Recomendamos especializares mais o tópico." />
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {!showRejectInput && (
                <div className="flex items-center gap-2 mr-auto">
                  <label className="text-xs text-slate-600 font-medium">Receita instrutor</label>
                  <select value={revenueShare} onChange={(e) => setRevenueShare(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded px-2 py-1">
                    <option value={40}>40%</option>
                    <option value={50}>50%</option>
                    <option value={60}>60%</option>
                    <option value={70}>70%</option>
                  </select>
                </div>
              )}
              <button onClick={reject} disabled={action !== 'idle' || (showRejectInput && !rejectReason)}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                {action === 'rejecting' ? 'A rejeitar...' : showRejectInput ? '✗ Confirmar rejeição' : '✗ Rejeitar'}
              </button>
              {!showRejectInput && (
                <button onClick={approve} disabled={action !== 'idle'}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow">
                  {action === 'approving' ? 'A aprovar...' : '✓ Aprovar e criar conta'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[110px] flex-shrink-0 mt-0.5">{label}</dt>
      <dd className="text-sm text-slate-700 break-words min-w-0">{value}</dd>
    </div>
  );
}

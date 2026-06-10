'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { updatePlacementStatusAction, listOrgPlacementsAction } from '../../talent-actions';
import { Briefcase, Users, Loader2, X, CheckCircle, Award } from 'lucide-react';

const STAGES = [
  { id: 'introduced', labelKey: 'org.pipe.stage_introduced', color: 'bg-slate-100 text-slate-700' },
  { id: 'interested', labelKey: 'org.pipe.stage_interested', color: 'bg-blue-100 text-blue-800' },
  { id: 'interviewed', labelKey: 'org.pipe.stage_interviewed', color: 'bg-violet-100 text-violet-800' },
  { id: 'offered', labelKey: 'org.pipe.stage_offered', color: 'bg-amber-100 text-amber-800' },
  { id: 'hired', labelKey: 'org.pipe.stage_hired', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'rejected', labelKey: 'org.pipe.stage_rejected', color: 'bg-rose-100 text-rose-700' },
];

function fmt(cents: number | null | undefined, locale: string, currency = 'EUR') {
  if (!cents) return '—';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function PipelineClient({ orgId, orgSlug, memberRole, locale, placements: initial }: {
  orgId: string; orgSlug: string; memberRole: string; locale: string; placements: any[];
}) {
  const t = useTranslations();
  const [placements, setPlacements] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [hiringId, setHiringId] = useState<any | null>(null);
  const canAct = ['owner','admin','manager'].includes(memberRole);

  async function reload() {
    const r = await listOrgPlacementsAction(orgId);
    if (r.ok) setPlacements(r.placements);
  }

  async function moveStage(id: string, newStage: string) {
    if (newStage === 'hired') {
      const p = placements.find(x => x.id === id);
      setHiringId(p);
      return;
    }
    startTransition(async () => {
      const r = await updatePlacementStatusAction(id, newStage);
      if (r.ok) reload();
      else alert(t('org.cl.error_generic', { error: r.error || 'unknown' }));
    });
  }

  const byStage: Record<string, any[]> = {};
  for (const s of STAGES) byStage[s.id] = [];
  for (const p of placements) {
    const stage = p.pipeline_status || 'introduced';
    if (byStage[stage]) byStage[stage].push(p);
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-6 w-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-slate-900">{t('org.pipe.title')}</h1>
            </div>
            <p className="text-sm text-slate-500">{t('org.pipe.count', { count: placements.length })}</p>
          </div>
          <Link href={`/empresa/${orgSlug}/talent` as any}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">
            <Users className="h-4 w-4" /> {t('org.pipe.browse')}
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6 overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 min-w-[900px] lg:min-w-0">
          {STAGES.map((stage) => (
            <div key={stage.id} className="bg-slate-100 rounded-xl p-3 min-h-[400px]">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stage.color}`}>{t(stage.labelKey)}</span>
                <span className="text-xs text-slate-500">{byStage[stage.id].length}</span>
              </div>
              <div className="space-y-2">
                {byStage[stage.id].map((p) => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {p.talent_avatar ? (
                        <img src={p.talent_avatar} alt={p.talent_name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold">
                          {p.talent_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{p.talent_name || t('org.pipe.candidate_fallback')}</div>
                        {p.job_title && <div className="text-[10px] text-slate-500 truncate">{p.job_title}</div>}
                      </div>
                    </div>
                    {p.talent_headline && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{p.talent_headline}</p>}
                    {p.certified_skills && p.certified_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.certified_skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded flex items-center gap-0.5">
                            <Award className="h-2.5 w-2.5" />{s}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.annual_salary_cents && stage.id === 'hired' && (
                      <div className="text-xs font-semibold text-emerald-700 mb-2">
                        {t('org.pipe.salary_fee', { salary: fmt(p.annual_salary_cents, locale), fee: fmt(p.placement_fee_cents, locale) })}
                      </div>
                    )}
                    {canAct && !['hired', 'rejected'].includes(stage.id) && (
                      <select onChange={(e) => moveStage(p.id, e.target.value)} value="" disabled={pending}
                        className="w-full text-xs px-2 py-1 border border-slate-200 rounded bg-white">
                        <option value="">{t('org.pipe.move_to')}</option>
                        {STAGES.filter(s => s.id !== stage.id).map(s => <option key={s.id} value={s.id}>{t(s.labelKey)}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                {byStage[stage.id].length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-4">{t('org.pipe.empty_col')}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hiringId && (
        <HireModal placement={hiringId} locale={locale} onClose={() => setHiringId(null)} onHired={() => { setHiringId(null); reload(); }} />
      )}
    </main>
  );
}

function HireModal({ placement, locale, onClose, onHired }: { placement: any; locale: string; onClose: () => void; onHired: () => void }) {
  const t = useTranslations();
  const [salary, setSalary] = useState('');
  const [feePct, setFeePct] = useState('15');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const salaryNum = parseFloat(salary || '0');
  const feeNum = parseFloat(feePct || '15');
  const feeCents = Math.round(salaryNum * 100 * feeNum / 100);

  function submit() {
    setError(null);
    if (!salaryNum || salaryNum <= 0) return setError(t('org.pipe.err_salary'));
    if (feeNum <= 0 || feeNum > 100) return setError(t('org.pipe.err_fee'));
    startTransition(async () => {
      const r = await updatePlacementStatusAction(placement.id, 'hired', Math.round(salaryNum * 100), feeNum);
      if (r.ok) onHired();
      else setError(r.error || t('tea.error'));
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{t('org.pipe.hire_title')}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600">{t('org.pipe.candidate_label')} <strong>{placement.talent_name}</strong></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('org.pipe.salary_label')}</label>
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="50000" step="1000" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('org.pipe.fee_label')}</label>
            <input type="number" value={feePct} onChange={(e) => setFeePct(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="15" step="0.5" min="0" max="100" />
          </div>
          {salaryNum > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm">
              <strong className="text-emerald-900">{t('org.pipe.fee_payable', { amount: fmt(feeCents, locale) })}</strong>
              <div className="text-xs text-emerald-700 mt-1">{t('org.pipe.fee_basis', { pct: feeNum, salary: fmt(Math.round(salaryNum * 100), locale) })}</div>
            </div>
          )}
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('btn.cancel')}</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <CheckCircle className="h-4 w-4" /> {t('org.pipe.confirm_hire')}
          </button>
        </div>
      </div>
    </div>
  );
}

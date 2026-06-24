'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { browseTalentAction, createPlacementAction } from '../talent-actions';
import { Search, Users, MapPin, Briefcase, Award, X, Loader2, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

function fmt(cents: number | null | undefined, locale: string, currency = 'EUR') {
  if (!cents) return '—';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function TalentBrowseClient({ orgId, orgName, orgSlug, memberRole, featureEnabled, jobs, locale, initial }: {
  orgId: string; orgName: string; orgSlug: string; memberRole: string;
  featureEnabled: boolean; jobs: any[]; locale: string; initial: { total: number; talents: any[] };
}) {
  const t = useTranslations();
  const [talents, setTalents] = useState(initial.talents);
  const [total, setTotal] = useState(initial.total);
  const [search, setSearch] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [remoteOk, setRemoteOk] = useState<string>('');
  const [pending, startTransition] = useTransition();
  const [contacting, setContacting] = useState<any | null>(null);
  const canAct = ['owner','admin','manager'].includes(memberRole);

  function applyFilters() {
    const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    startTransition(async () => {
      const r = await browseTalentAction(orgId, {
        search, skills, remoteOk: remoteOk === 'yes' ? true : remoteOk === 'no' ? false : undefined,
      });
      if (r.ok) { setTalents(r.talents); setTotal(r.total); }
    });
  }

  if (!featureEnabled) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h2 className="font-bold text-slate-900 text-lg mb-1">{t('org.tb.unavailable_h')}</h2>
            <p className="text-sm text-slate-600 mb-4">{t('org.tb.unavailable_p', { org: orgName })}</p>
            <Link href={`/empresa/${orgSlug}` as any} className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg inline-block">{t('btn.back')}</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <AppPageHeader title={t('org.tb.title')} description={t('org.tb.subtitle')} actions={
          <Link href={`/empresa/${orgSlug}/talent/pipeline` as any}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">
            <Briefcase className="h-4 w-4" /> {t('org.tb.pipeline_btn')}
          </Link>
        } />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder={t('org.tb.search_ph')}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <input type="text" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)}
            placeholder={t('org.tb.skills_ph')}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <select value={remoteOk} onChange={(e) => setRemoteOk(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">{t('org.tb.remote_any')}</option>
            <option value="yes">{t('org.tb.remote_yes')}</option>
            <option value="no">{t('org.tb.remote_no')}</option>
          </select>
          <button onClick={applyFilters} disabled={pending}
            className="sm:col-span-3 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {pending ? t('org.tb.filtering') : t('org.tb.apply', { count: total })}
          </button>
        </div>

        {talents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">{t('org.tb.empty_h')}</h3>
            <p className="text-sm text-slate-500">{t('org.tb.empty_p')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {talents.map((cand) => (
              <div key={cand.user_id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  {cand.avatar_url ? (
                    <img src={cand.avatar_url} alt={cand.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold">
                      {cand.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{cand.name || t('org.pipe.candidate_fallback')}</h3>
                      {cand.match_score != null && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          cand.match_score >= 75 ? 'bg-emerald-100 text-emerald-800' :
                          cand.match_score >= 50 ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>{t('org.tb.match', { score: cand.match_score })}</span>
                      )}
                    </div>
                    {cand.headline && <p className="text-sm text-slate-600 line-clamp-1">{cand.headline}</p>}
                  </div>
                </div>
                
                {cand.bio && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{cand.bio}</p>}
                
                {cand.certified_skills && cand.certified_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {cand.certified_skills.slice(0, 6).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full flex items-center gap-0.5">
                        <Award className="h-3 w-3" />{s}
                      </span>
                    ))}
                    {cand.certified_skills.length > 6 && <span className="text-xs text-slate-500">+{cand.certified_skills.length - 6}</span>}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-3">
                  {cand.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{cand.location}</span>}
                  {cand.years_experience != null && <span>{t('org.tb.years_exp', { years: cand.years_experience })}</span>}
                  {cand.remote_ok && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{t('org.tb.remote_ok')}</span>}
                  {(cand.desired_salary_min_cents || cand.desired_salary_max_cents) && (
                    <span>{t('org.tb.salary_range', { min: fmt(cand.desired_salary_min_cents, locale, cand.currency), max: fmt(cand.desired_salary_max_cents, locale, cand.currency) })}</span>
                  )}
                </div>
                
                {canAct && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setContacting(cand)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">
                      <Send className="h-3.5 w-3.5" /> {t('org.tb.contact_btn')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {contacting && (
        <ContactModal talent={contacting} orgId={orgId} jobs={jobs} orgSlug={orgSlug}
          onClose={() => setContacting(null)} />
      )}
    </main>
  );
}

function ContactModal({ talent, orgId, jobs, orgSlug, onClose }: { talent: any; orgId: string; jobs: any[]; orgSlug: string; onClose: () => void }) {
  const t = useTranslations();
  const [jobId, setJobId] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createPlacementAction(orgId, talent.user_id, jobId || undefined, notes || undefined);
      if (r.ok) setSuccess(true);
      else setError(r.error || t('tea.error'));
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white max-w-md rounded-2xl p-6 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">{t('org.tb.contacted_h')}</h3>
          <p className="text-sm text-slate-600 mb-3">{t('org.tb.contacted_p', { name: talent.name })}</p>
          <Link href={`/empresa/${orgSlug}/talent/pipeline` as any} className="text-sm text-emerald-600 hover:underline">
            {t('org.tb.view_pipeline')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{t('org.tb.modal_title')}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600">{t('org.tb.contacting_label')} <strong>{talent.name}</strong></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('org.tb.job_label')}</label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
              <option value="">{t('org.tb.no_job')}</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('org.tb.notes_label')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder={t('org.tb.notes_ph')} />
          </div>
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('btn.cancel')}</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('org.tb.contact_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}

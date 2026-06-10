'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Users, Award, MapPin, Briefcase, Euro, TrendingUp, Sparkles } from 'lucide-react';

interface Match {
  user_id: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  bonus_skills: string[];
  headline: string | null;
  certified_skills: string[];
  years_experience: number | null;
  location: string | null;
  remote_ok: boolean | null;
  desired_salary_min_cents: number | null;
  desired_salary_max_cents: number | null;
  available: boolean;
}

interface Data {
  job: { id: string; title: string; required_skills: string[]; nice_to_have_skills: string[]; location: string | null; salary_min_cents: number | null; salary_max_cents: number | null; currency: string };
  matches: Match[];
}

export function CandidatesClient({ slug, initial }: { slug: string; initial: Data }) {
  const t = useTranslations();
  const { job, matches } = initial;
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link href={`/empresa/${slug}/admin/vagas` as any} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> {t('org.cand.back')}
      </Link>
      
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-600" /> {t('org.cand.title')} · {job.title}
        </h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(job.required_skills || []).map((s, i) => (
            <span key={i} className="text-[10px] uppercase font-bold tracking-wider bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">{t('org.cand.req_label')}: {s}</span>
          ))}
          {(job.nice_to_have_skills || []).map((s, i) => (
            <span key={i} className="text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{t('org.cand.nice_label')}: {s}</span>
          ))}
        </div>
      </div>
      
      {matches.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-amber-600 mb-2" />
          <div className="text-sm font-semibold text-amber-900">{t('org.cand.empty_h')}</div>
          <p className="text-xs text-amber-800 mt-1">{t('org.cand.empty_p')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">{t('org.cand.count', { count: matches.length })}</div>
          {matches.map((m) => <CandidateCard key={m.user_id} match={m} currency={job.currency} />)}
        </div>
      )}
    </div>
  );
}

function CandidateCard({ match, currency }: { match: Match; currency: string }) {
  const t = useTranslations();
  const scoreColor = match.match_score >= 70 ? 'text-emerald-700 bg-emerald-50' 
    : match.match_score >= 40 ? 'text-amber-700 bg-amber-50' 
    : 'text-slate-700 bg-slate-50';
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className={`text-center px-3 py-1.5 rounded-lg ${scoreColor} flex-shrink-0`}>
          <div className="text-lg font-bold">{match.match_score.toFixed(0)}</div>
          <div className="text-[10px] uppercase tracking-wider">{t('org.cand.match_label')}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900">{match.headline || t('org.cand.anon')}</h3>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
            {match.years_experience != null && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {t('org.cand.years', { years: match.years_experience })}</span>}
            {match.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.location}</span>}
            {match.remote_ok && <span className="text-indigo-600 font-medium">{t('org.cand.remote_ok')}</span>}
            {match.desired_salary_min_cents != null && match.desired_salary_max_cents != null && (
              <span className="inline-flex items-center gap-1"><Euro className="h-3 w-3" /> {(match.desired_salary_min_cents/100/1000).toFixed(0)}k–{(match.desired_salary_max_cents/100/1000).toFixed(0)}k</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 space-y-1.5">
        {match.matched_skills.length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">{t('org.cand.matched')} ({match.matched_skills.length}): </span>
            {match.matched_skills.map((s, i) => (
              <span key={i} className="text-xs bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded mx-0.5 inline-block">{s}</span>
            ))}
          </div>
        )}
        {match.bonus_skills.length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700">{t('org.cand.bonus')} ({match.bonus_skills.length}): </span>
            {match.bonus_skills.map((s, i) => (
              <span key={i} className="text-xs bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded mx-0.5 inline-block">{s}</span>
            ))}
          </div>
        )}
        {match.missing_skills.length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">{t('org.cand.missing')} ({match.missing_skills.length}): </span>
            {match.missing_skills.map((s, i) => (
              <span key={i} className="text-xs bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded mx-0.5 inline-block">{s}</span>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-3 flex gap-2 text-xs">
        <button className="px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold">{t('org.cand.contact_btn')}</button>
        <span className="text-slate-400 text-[10px] self-center">{t('org.cand.id_label')}: {match.user_id.slice(0, 8)}…</span>
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { Briefcase, Plus, ArrowLeft, X, Save, Loader2, Users, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { upsertJobPostingAction, listJobPostingsAction } from './actions';

interface Job {
  id?: string; org_id?: string; title: string; description?: string;
  required_skills?: string[]; nice_to_have_skills?: string[];
  location?: string; remote_ok?: boolean; employment_type?: string;
  salary_min_cents?: number; salary_max_cents?: number; currency: string;
  status: string; posted_at?: string | null; created_at?: string;
}

const EMPTY: Job = { title: '', currency: 'EUR', status: 'draft' };

const STATUS_COLOR: Record<string,string> = {
  draft: 'bg-slate-100 text-slate-600',
  open: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  filled: 'bg-indigo-100 text-indigo-700',
  closed: 'bg-slate-100 text-slate-500',
};

const STATUS_KEYS: Record<string,string> = {
  draft: 'org.job.status_draft',
  open: 'org.job.status_open',
  paused: 'org.job.status_paused',
  filled: 'org.job.status_filled',
  closed: 'org.job.status_closed',
};

export function JobPostingsClient({ slug, initial }: { slug: string; initial: Job[] }) {
  const t = useTranslations();
  const [items, setItems] = useState<Job[]>(initial);
  const [editing, setEditing] = useState<Job | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const r = await listJobPostingsAction(slug);
    if (r.ok) setItems((r.data as Job[]) || []);
  }

  function handleSave() {
    if (!editing || !editing.title) { toast.error(t('org.job.title_required')); return; }
    startTransition(async () => {
      const r = await upsertJobPostingAction(slug, editing as unknown as Record<string, unknown>);
      if (r.ok) { toast.success(t('org.job.saved')); setEditing(null); await refresh(); }
      else toast.error(r.error || t('tea.error'));
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link href={`/empresa/${slug}/admin` as any} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> {t('org.job.back')}
      </Link>
      
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2"><Briefcase className="h-6 w-6 text-brand-600" /> {t('org.nav.jobs_h')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('org.nav.jobs_p')}</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
          <Plus className="h-3.5 w-3.5" /> {t('org.job.new')}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          {t('org.job.empty')}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((j) => (
            <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{j.title}</h3>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[j.status]}`}>{STATUS_KEYS[j.status] ? t(STATUS_KEYS[j.status]) : j.status}</span>
                    {j.remote_ok && <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{t('org.job.remote_badge')}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                    {j.location && <span>{j.location}</span>}
                    {j.required_skills && j.required_skills.length > 0 && <span>{t('org.job.skills_count', { count: j.required_skills.length })}</span>}
                    {j.salary_min_cents != null && j.salary_max_cents != null && (
                      <span>{(j.salary_min_cents/100).toFixed(0)}–{(j.salary_max_cents/100).toFixed(0)} {j.currency}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {j.status === 'open' && j.id && (
                    <Link href={`/empresa/${slug}/admin/vagas/${j.id}/candidatos` as any}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      <Users className="h-3 w-3" /> {t('org.cand.title')} <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                  <button onClick={() => setEditing({ ...EMPTY, ...j })}
                    className="text-xs px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium">{t('org.job.edit')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <JobEditDialog job={editing} setJob={setEditing} onSave={handleSave} onCancel={() => setEditing(null)} isPending={isPending} />}
    </div>
  );
}

function JobEditDialog({ job, setJob, onSave, onCancel, isPending }: { job: Job; setJob: (j: Job) => void; onSave: () => void; onCancel: () => void; isPending: boolean }) {
  const t = useTranslations();
  const [reqInput, setReqInput] = useState((job.required_skills || []).join(', '));
  const [niceInput, setNiceInput] = useState((job.nice_to_have_skills || []).join(', '));
  
  function update<K extends keyof Job>(k: K, v: Job[K]) {
    const next = { ...job, [k]: v };
    setJob(next);
  }
  
  function persistSkills() {
    const req = reqInput.split(',').map((s) => s.trim()).filter(Boolean);
    const nice = niceInput.split(',').map((s) => s.trim()).filter(Boolean);
    setJob({ ...job, required_skills: req, nice_to_have_skills: nice });
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{job.id ? t('org.job.edit_title') : t('org.job.new')}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-md"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <Field label={t('org.job.f_title')}><input type="text" value={job.title || ''} onChange={(e) => update('title', e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" placeholder={t('org.job.ph_title')} /></Field>
          <Field label={t('org.job.f_desc')}><textarea rows={3} value={job.description || ''} onChange={(e) => update('description', e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 resize-none" /></Field>
          <Field label={t('org.job.f_req_skills')}><input type="text" value={reqInput} onChange={(e) => setReqInput(e.target.value)} onBlur={persistSkills} placeholder={t('org.job.ph_req')} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" /></Field>
          <Field label={t('org.job.f_nice_skills')}><input type="text" value={niceInput} onChange={(e) => setNiceInput(e.target.value)} onBlur={persistSkills} placeholder={t('org.job.ph_nice')} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('org.job.f_location')}><input type="text" value={job.location || ''} onChange={(e) => update('location', e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" /></Field>
            <Field label={t('org.job.f_type')}><input type="text" value={job.employment_type || ''} onChange={(e) => update('employment_type', e.target.value)} placeholder={t('org.job.ph_type')} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" /></Field>
            <Field label={t('org.job.f_salary_min')}><input type="number" value={job.salary_min_cents ?? ''} onChange={(e) => update('salary_min_cents', e.target.value === '' ? undefined : Number(e.target.value))} className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-slate-200" /></Field>
            <Field label={t('org.job.f_salary_max')}><input type="number" value={job.salary_max_cents ?? ''} onChange={(e) => update('salary_max_cents', e.target.value === '' ? undefined : Number(e.target.value))} className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-slate-200" /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={job.remote_ok || false} onChange={(e) => update('remote_ok', e.target.checked)} className="rounded" /> {t('org.job.f_remote')}</label>
          <Field label={t('org.job.f_status')}>
            <select value={job.status} onChange={(e) => update('status', e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white">
              <option value="draft">{t('org.job.status_draft')}</option>
              <option value="open">{t('org.job.status_open')}</option>
              <option value="paused">{t('org.job.status_paused')}</option>
              <option value="filled">{t('org.job.status_filled')}</option>
              <option value="closed">{t('org.job.status_closed')}</option>
            </select>
          </Field>
        </div>
        <div className="border-t border-slate-100 p-3 flex gap-2 justify-end">
          <button onClick={onCancel} disabled={isPending} className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">{t('btn.cancel')}</button>
          <button onClick={() => { persistSkills(); onSave(); }} disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {t('account.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-600 block mb-1">{label}</label>{children}</div>;
}

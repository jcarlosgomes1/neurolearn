'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { toast } from 'sonner';
import { COUNTRIES, countryName, defaultCountryByLocale } from '@/lib/utils/countries';

interface FormState {
  full_name: string; email: string; phone: string; phone_country_code: string;
  country_code: string; city: string;
  linkedin_url: string; website_url: string; github_url: string;
  preferred_lang: string;
  expertise: string[]; years_experience: number | '';
  job_title: string; current_company: string;
  teaching_experience: string;
  proposed_course_title: string; proposed_course_description: string;
  proposed_course_format: string; proposed_course_language: string;
  proposed_target_audience: string; proposed_course_outline: string;
  proposed_course_duration: string; proposed_course_price_eur: number | '';
  demo_video_url: string; sample_lesson_url: string;
  portfolio_links: string; references_text: string;
}

const EXPERTISE_OPTIONS: Array<{ value: string; key: string }> = [
  { value: 'genai', key: 'apply.expertise.genai' },
  { value: 'llms', key: 'apply.expertise.llms' },
  { value: 'cv', key: 'apply.expertise.cv' },
  { value: 'nlp', key: 'apply.expertise.nlp' },
  { value: 'ml', key: 'apply.expertise.ml' },
  { value: 'ds', key: 'apply.expertise.ds' },
  { value: 'automation', key: 'apply.expertise.automation' },
  { value: 'business', key: 'apply.expertise.business' },
  { value: 'marketing', key: 'apply.expertise.marketing' },
  { value: 'sales', key: 'apply.expertise.sales' },
  { value: 'productivity', key: 'apply.expertise.productivity' },
  { value: 'finance', key: 'apply.expertise.finance' },
  { value: 'python', key: 'apply.expertise.python' },
  { value: 'tools', key: 'apply.expertise.tools' },
  { value: 'ethics', key: 'apply.expertise.ethics' },
];

export function CandidaturaForm() {
  const t = useTranslations();
  const locale = useLocale();

  // Initial defaults baseado no locale do user
  const initial: FormState = useMemo(() => {
    const defaultCountry = defaultCountryByLocale(locale);
    const cc = COUNTRIES.find((c) => c.code === defaultCountry);
    return {
      full_name: '', email: '', phone: '',
      phone_country_code: cc?.dial || '+351',
      country_code: defaultCountry, city: '',
      linkedin_url: '', website_url: '', github_url: '',
      preferred_lang: locale,
      expertise: [], years_experience: '',
      job_title: '', current_company: '', teaching_experience: '',
      proposed_course_title: '', proposed_course_description: '',
      proposed_course_format: 'reading', proposed_course_language: locale,
      proposed_target_audience: '', proposed_course_outline: '',
      proposed_course_duration: '4-6h', proposed_course_price_eur: 49,
      demo_video_url: '', sample_lesson_url: '',
      portfolio_links: '', references_text: '',
    };
  }, [locale]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleExpertise(value: string) {
    setForm((f) => ({
      ...f,
      expertise: f.expertise.includes(value)
        ? f.expertise.filter((v) => v !== value)
        : f.expertise.length < 6 ? [...f.expertise, value] : f.expertise,
    }));
  }

  function canAdvance(): boolean {
    if (step === 1) return !!form.full_name && !!form.email && form.email.includes('@');
    if (step === 2) return form.expertise.length > 0 && !!form.job_title;
    if (step === 3) return !!form.proposed_course_title && !!form.proposed_course_description && form.proposed_course_description.length >= 50;
    return true;
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const expertiseLabels = form.expertise.map((v) => {
        const opt = EXPERTISE_OPTIONS.find((o) => o.value === v);
        return opt ? t(opt.key) : v;
      });
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/instructor-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          application: {
            ...form,
            // backwards-compat: backend still expects `country` as label
            country: countryName(form.country_code, 'pt'),
            phone: form.phone ? `${form.phone_country_code} ${form.phone}` : '',
            expertise: expertiseLabels,
            years_experience: form.years_experience || null,
            proposed_course_price_eur: form.proposed_course_price_eur || null,
          },
        }),
      });
      const data = await resp.json();
      if (!data.ok) {
        toast.error(data.error || t('apply.form.failed_toast'));
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      toast.success(t('apply.form.success_toast'));
    } catch (e: any) {
      toast.error(e.message || t('apply.form.network_error'));
    } finally { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 sm:p-10 text-center animate-fade-in">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('apply.form.received_title')}</h2>
        <p className="text-slate-700 leading-relaxed mb-6">
          {t('apply.form.received_body_pre')} <strong>{form.email}</strong>.<br />
          {t('apply.form.received_body_post')}
        </p>
        <p className="text-sm text-slate-500">{t('apply.form.good_luck')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step ? 'bg-emerald-500 text-white' :
                s === step ? 'bg-brand-600 text-white scale-110' :
                'bg-slate-200 text-slate-500'
              }`}>{s < step ? '✓' : s}</div>
              {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${s < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        <div className="text-center mt-3 text-xs text-slate-500">
          {step === 1 && t('apply.form.step1_label')}
          {step === 2 && t('apply.form.step2_label')}
          {step === 3 && t('apply.form.step3_label')}
          {step === 4 && t('apply.form.step4_label')}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{t('apply.form.s1_title')}</h2>
            <p className="text-sm text-slate-500 mb-5">{t('apply.form.s1_subtitle')}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">{t('apply.form.full_name_label')}</label><input className="input" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder={t('apply.form.full_name_ph')} /></div>
              <div><label className="label">{t('apply.form.email_label')}</label><input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@example.com" /></div>
              
              <div className="sm:col-span-2">
                <label className="label">{t('apply.form.phone_label')}</label>
                <div className="flex gap-2">
                  <select className="input w-32" value={form.phone_country_code} onChange={(e) => update('phone_country_code', e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.dial}>{c.dial} ({c.code})</option>)}
                  </select>
                  <input type="tel" className="input flex-1" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="912 345 678" />
                </div>
              </div>

              <div><label className="label">{t('apply.form.lang_label')}</label>
                <select className="input" value={form.preferred_lang} onChange={(e) => update('preferred_lang', e.target.value)}>
                  <option value="pt">{t('apply.lang.pt')}</option><option value="en">{t('apply.lang.en')}</option><option value="es">{t('apply.lang.es')}</option><option value="fr">{t('apply.lang.fr')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('apply.form.country_label')}</label>
                <select className="input" value={form.country_code} onChange={(e) => update('country_code', e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryName(c.code, locale)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label">{t('apply.form.city_label')}</label><input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Lisboa" /></div>
            </div>
            <div className="pt-2"><label className="label">{t('apply.form.linkedin_label')}</label><input className="input" value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">{t('apply.form.website_label')}</label><input className="input" value={form.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://..." /></div>
              <div><label className="label">{t('apply.form.github_label')}</label><input className="input" value={form.github_url} onChange={(e) => update('github_url', e.target.value)} placeholder="https://github.com/..." /></div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{t('apply.form.s2_title')}</h2>
            <p className="text-sm text-slate-500 mb-5">{t('apply.form.s2_subtitle')}</p>
            <div>
              <label className="label">{t('apply.form.expertise_label')} <span className="text-xs text-slate-400">{t('apply.form.expertise_hint')}</span></label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EXPERTISE_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => toggleExpertise(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${form.expertise.includes(opt.value) ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'}`}>
                    {t(opt.key)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">{t('apply.form.years_label')}</label><input type="number" min="0" max="50" className="input" value={form.years_experience} onChange={(e) => update('years_experience', e.target.value ? parseInt(e.target.value) : '')} /></div>
              <div><label className="label">{t('apply.form.job_label')}</label><input className="input" value={form.job_title} onChange={(e) => update('job_title', e.target.value)} placeholder={t('apply.form.job_ph')} /></div>
              <div className="sm:col-span-2"><label className="label">{t('apply.form.company_label')}</label><input className="input" value={form.current_company} onChange={(e) => update('current_company', e.target.value)} placeholder={t('apply.form.company_ph')} /></div>
            </div>
            <div><label className="label">{t('apply.form.teaching_label')}</label><textarea className="input min-h-[100px]" value={form.teaching_experience} onChange={(e) => update('teaching_experience', e.target.value)} placeholder={t('apply.form.teaching_ph')} /></div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{t('apply.form.s3_title')}</h2>
            <p className="text-sm text-slate-500 mb-5">{t('apply.form.s3_subtitle')}</p>
            <div><label className="label">{t('apply.form.course_title_label')}</label><input className="input" value={form.proposed_course_title} onChange={(e) => update('proposed_course_title', e.target.value)} placeholder={t('apply.form.course_title_ph')} /></div>
            <div>
              <label className="label">{t('apply.form.course_desc_label')} <span className="text-xs text-slate-400">{t('apply.form.course_desc_hint')}</span></label>
              <textarea className="input min-h-[120px]" value={form.proposed_course_description} onChange={(e) => update('proposed_course_description', e.target.value)} placeholder={t('apply.form.course_desc_ph')} />
              <div className="text-xs text-slate-400 mt-1 tabular-nums">{form.proposed_course_description.length} {t('apply.form.chars_min50')}</div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="label">{t('apply.form.format_label')}</label>
                <select className="input" value={form.proposed_course_format} onChange={(e) => update('proposed_course_format', e.target.value)}>
                  <option value="reading">{t('apply.format.reading')}</option><option value="video">{t('apply.format.video')}</option><option value="exercise">{t('apply.format.exercise')}</option><option value="mixed">{t('apply.format.mixed')}</option>
                </select>
              </div>
              <div><label className="label">{t('apply.form.lang_label')}</label>
                <select className="input" value={form.proposed_course_language} onChange={(e) => update('proposed_course_language', e.target.value)}>
                  <option value="pt">{t('apply.lang.pt')}</option><option value="en">{t('apply.lang.en')}</option><option value="es">{t('apply.lang.es')}</option><option value="fr">{t('apply.lang.fr')}</option>
                </select>
              </div>
              <div><label className="label">{t('apply.form.duration_label')}</label>
                <select className="input" value={form.proposed_course_duration} onChange={(e) => update('proposed_course_duration', e.target.value)}>
                  <option value="1-3h">{t('apply.duration.opt1')}</option><option value="4-6h">{t('apply.duration.opt2')}</option><option value="7-12h">{t('apply.duration.opt3')}</option><option value="13-25h">{t('apply.duration.opt4')}</option><option value="25h+">{t('apply.duration.opt5')}</option>
                </select>
              </div>
            </div>
            <div><label className="label">{t('apply.form.audience_label')}</label><input className="input" value={form.proposed_target_audience} onChange={(e) => update('proposed_target_audience', e.target.value)} placeholder={t('apply.form.audience_ph')} /></div>
            <div><label className="label">{t('apply.form.outline_label')}</label><textarea className="input min-h-[120px]" value={form.proposed_course_outline} onChange={(e) => update('proposed_course_outline', e.target.value)} placeholder={t('apply.form.outline_ph')} /></div>
            <div>
              <label className="label">{t('apply.form.price_label')}</label>
              <input type="number" min="0" max="500" className="input max-w-[200px]" value={form.proposed_course_price_eur} onChange={(e) => update('proposed_course_price_eur', e.target.value ? parseInt(e.target.value) : '')} />
              <p className="text-xs text-slate-500 mt-1">{t('apply.form.price_hint')}</p>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{t('apply.form.s4_title')}</h2>
            <p className="text-sm text-slate-500 mb-5">{t('apply.form.s4_subtitle')}</p>
            <div><label className="label">{t('apply.form.demo_label')}</label><input className="input" value={form.demo_video_url} onChange={(e) => update('demo_video_url', e.target.value)} placeholder="https://youtube.com/..." /><p className="text-xs text-slate-500 mt-1">{t('apply.form.demo_hint')}</p></div>
            <div><label className="label">{t('apply.form.sample_label')}</label><input className="input" value={form.sample_lesson_url} onChange={(e) => update('sample_lesson_url', e.target.value)} placeholder="https://..." /><p className="text-xs text-slate-500 mt-1">{t('apply.form.sample_hint')}</p></div>
            <div><label className="label">{t('apply.form.portfolio_label')}</label><textarea className="input min-h-[80px]" value={form.portfolio_links} onChange={(e) => update('portfolio_links', e.target.value)} placeholder={t('apply.form.portfolio_ph')} /></div>
            <div><label className="label">{t('apply.form.references_label')}</label><textarea className="input min-h-[80px]" value={form.references_text} onChange={(e) => update('references_text', e.target.value)} placeholder={t('apply.form.references_ph')} /></div>

            <div className="bg-slate-50 rounded-xl p-5 mt-6">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">{t('apply.form.summary_title')}</h3>
              <dl className="text-xs space-y-1.5 text-slate-600">
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">{t('apply.form.summary_name')}</dt><dd>{form.full_name}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">{t('apply.form.summary_email')}</dt><dd>{form.email}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">{t('apply.form.summary_role')}</dt><dd>{form.job_title}{form.current_company && ` · ${form.current_company}`}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">{t('apply.form.summary_expertise')}</dt><dd>{form.expertise.map((v) => { const opt = EXPERTISE_OPTIONS.find((o) => o.value === v); return opt ? t(opt.key) : v; }).join(', ')}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-slate-500 min-w-[100px]">{t('apply.form.summary_course')}</dt><dd className="font-medium text-slate-700">{form.proposed_course_title}</dd></div>
              </dl>
            </div>
          </>
        )}
      </div>

      <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
        {step > 1 ? (
          <button onClick={() => setStep((step - 1) as 1 | 2 | 3)} className="text-sm text-slate-600 hover:text-slate-900 font-medium">{t('apply.form.prev_btn')}</button>
        ) : <div />}
        {step < 4 ? (
          <button onClick={() => setStep((step + 1) as 2 | 3 | 4)} disabled={!canAdvance()} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all">{t('apply.form.next_btn')}</button>
        ) : (
          <button onClick={submit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all shadow">
            {submitting ? t('apply.form.submitting') : t('apply.form.submit_btn')}
          </button>
        )}
      </div>
    </div>
  );
}

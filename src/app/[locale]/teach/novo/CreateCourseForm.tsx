'use client';

import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { toast } from 'sonner';

type Phase = 'prompt' | 'configuring' | 'generating' | 'review';

interface GenJob {
  id: string;
  course_id: string;
  status: string;
  progress_total: number;
  progress_done: number;
  current_step: string;
  error_message: string | null;
}

interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  emoji: string | null;
  category: string | null;
  level: string | null;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    lessons: Array<{ id: string; title: string; type: string; duration_minutes: number }>;
  }>;
  hero_image_url: string | null;
}

const EMOJIS = ['📘','🤖','🧠','💡','📊','🎨','⚙️','🚀','📈','🔬','💬','🎯','🛠','✨'];

const DURATION_STRUCT: Record<string, [number, number]> = {
  short: [3, 3],
  medium: [5, 4],
  long: [7, 5],
};

export function CreateCourseForm() {
  const t = useTranslations('create_course');
  const router = useRouter();
  const locale = useLocale();
  const [category, setCategory] = useState('');
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const sb = createClient(); const { data } = await sb.rpc('nl_course_categories_list', { p_lang: locale }); if (Array.isArray(data)) setCats(data); } catch {} })(); }, [locale]);
  const [phase, setPhase] = useState<Phase>('prompt');
  const [prompt, setPrompt] = useState('');
  const [level, setLevel] = useState<'beginner'|'intermediate'|'advanced'>('intermediate');
  const [duration, setDuration] = useState('medium');
  const [tone, setTone] = useState<'didactic'|'practical'|'technical'|'inspirational'>('practical');
  const [includeVideo, setIncludeVideo] = useState(false);
  const [includeExercises, setIncludeExercises] = useState(true);
  const [customOn, setCustomOn] = useState(false);
  const [cMods, setCMods] = useState(5);
  const [cLessons, setCLessons] = useState(4);
  const [cMins, setCMins] = useState(25);
  const [policy, setPolicy] = useState<any>({ allow_instructor_custom: true, min_modules: 1, max_modules: 12, min_lessons: 1, max_lessons: 10, allowed_minutes: [5, 10, 15, 20, 25, 30, 45, 60] });
  useEffect(() => { (async () => { try { const sb = createClient(); const { data } = await sb.rpc('nl_course_structure_policy'); if (data) setPolicy((p: any) => ({ ...p, ...data })); } catch {} })(); }, []);

  const [job, setJob] = useState<GenJob | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);

  const LEVELS: Array<['beginner'|'intermediate'|'advanced', string, string]> = [
    ['beginner', t('level.beginner'), t('level.beginner_hint')],
    ['intermediate', t('level.intermediate'), t('level.intermediate_hint')],
    ['advanced', t('level.advanced'), t('level.advanced_hint')],
  ];
  const DURATIONS: Array<[string, string, number, number]> = [
    ['short', t('duration.short'), DURATION_STRUCT.short[0], DURATION_STRUCT.short[1]],
    ['medium', t('duration.medium'), DURATION_STRUCT.medium[0], DURATION_STRUCT.medium[1]],
    ['long', t('duration.long'), DURATION_STRUCT.long[0], DURATION_STRUCT.long[1]],
  ];
  const TONES: Array<['didactic'|'practical'|'technical'|'inspirational', string]> = [
    ['didactic', t('tone.didactic')],
    ['practical', t('tone.practical')],
    ['technical', t('tone.technical')],
    ['inspirational', t('tone.inspirational')],
  ];

  useEffect(() => {
    if (phase !== 'generating' || !job) return;
    const interval = setInterval(async () => {
      try {
        const sb = createClient();
        const { data } = await sb.from('nl_course_generation_jobs').select('*').eq('id', job.id).single();
        if (!data) return;
        setJob(data as GenJob);
        if (data.status === 'completed') {
          const { data: c } = await sb.from('nl_courses').select('id, title, subtitle, description, emoji, category, level, modules, hero_image_url').eq('id', job.course_id).single();
          if (c) setCourse(c as Course);
          setPhase('review');
          clearInterval(interval);
        } else if (data.status === 'failed') {
          toast.error(t('err_fail', { msg: data.error_message || t('err_unknown') }));
          setPhase('configuring');
          clearInterval(interval);
        }
      } catch (e) { console.error(e); }
    }, 2500);
    return () => clearInterval(interval);
  }, [phase, job, t]);

  async function startGeneration() {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error(t('err_min_chars'));
      return;
    }
    if (!category) { toast.error(t('cc_category_required')); return; }
    setPhase('generating');
    setJob({ id: 'pending', course_id: 'pending', status: 'pending', progress_total: 0, progress_done: 0, current_step: t('starting'), error_message: null });

    const dur = DURATIONS.find((d) => d[0] === duration) || DURATIONS[1];
    const formats: ('reading'|'video'|'exercise')[] = ['reading'];
    if (includeVideo) formats.push('video');
    if (includeExercises) formats.push('exercise');

    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { toast.error(t('session_expired')); setPhase('configuring'); return; }
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-full-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          config: {
            topic: prompt.trim(),
            level,
            num_modules: customOn ? cMods : dur[2],
            lessons_per_module: customOn ? cLessons : dur[3],
            avg_lesson_minutes: customOn ? cMins : 25,
            tone,
            depth: duration === 'long' ? 'extensive' : duration === 'short' ? 'summary' : 'normal',
            formats,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            category,
            course_type: 'ai_generated',
            language: 'pt',
          },
        }),
      });
      const data = await resp.json();
      if (!data.ok) {
        toast.error(data.error || t('gen_failed'));
        setPhase('configuring');
        return;
      }
      setJob({ id: data.job_id, course_id: data.course_id, status: 'pending', progress_total: 0, progress_done: 0, current_step: t('creating_struct'), error_message: null });
    } catch (e: any) {
      toast.error(e.message);
      setPhase('configuring');
    }
  }

  async function saveCourseMeta(updates: Partial<Course>) {
    if (!course) return;
    setSavingMeta(true);
    const sb = createClient();
    assertNotPeekClient();
    const { error } = await sb.from('nl_courses').update(updates).eq('id', course.id);
    if (error) toast.error(error.message);
    else { setCourse({ ...course, ...updates }); toast.success(t('saved')); }
    setSavingMeta(false);
  }

  async function publishOrSubmit() {
    if (!course) return;
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile && ['admin','super_admin'].includes(profile.role);
    assertNotPeekClient();
    const { error } = await sb.from('nl_courses').update({
      approval_status: isAdmin ? 'approved' : 'pending_review',
      published: isAdmin,
    }).eq('id', course.id);
    if (error) { toast.error(error.message); return; }
    toast.success(isAdmin ? t('course_published') : t('submitted'));
    router.push(`/teach/curso/${course.id}` as any);
  }

  if (phase === 'prompt') {
    return (
      <div className="pb-16">
        <AppPageHeader title={t('heading')} description={t('subheading')} />
        <p className="mb-6 text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 leading-relaxed">💡 {t('tip_intro')}</p>

        <textarea
          value={prompt} onChange={(e) => setPrompt(e.target.value)}
          autoFocus
          placeholder={t('prompt_ph')}
          rows={6}
          className="w-full p-5 text-base bg-white border-2 border-slate-200 focus:border-brand-500 rounded-2xl outline-none resize-none transition-colors leading-relaxed"
        />
        <div className="mt-2 text-xs text-slate-400 text-right tabular-nums">{t('char_count', { n: prompt.length })}</div>

        <button onClick={() => setPhase('configuring')} disabled={prompt.trim().length < 10}
          className="mt-6 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl text-base transition-all shadow-sm">
          {t('continue')}
        </button>

        <div className="mt-8 text-center text-xs text-slate-400">
          {t('explainer')}
        </div>
      </div>
    );
  }

  if (phase === 'configuring') {
    return (
      <div className="pb-16 space-y-6">
        <div>
          <button onClick={() => setPhase('prompt')} className="text-sm text-slate-500 hover:text-slate-900">{t('change_desc')}</button>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{t('refine')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('refine_sub')}</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{t('your_desc')}</div>
          <p className="text-sm text-slate-700 leading-relaxed">{prompt}</p>
        </div>

        <Section title={t('level_label')} hint={t('tip_level')}>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map(([v, l, hint]) => (
              <button key={v} onClick={() => setLevel(v)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${level === v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="font-semibold text-sm text-slate-900">{l}</div>
                <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title={t('depth_label')} hint={t('tip_depth')}>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map(([v, l, mods, aulas]) => (
              <button key={v} onClick={() => setDuration(v)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${duration === v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="font-semibold text-sm text-slate-900">{l}</div>
                <div className="text-xs text-slate-500 mt-0.5 tabular-nums">{t('duration.struct', { m: mods, l: aulas })}</div>
              </button>
            ))}
          </div>
        </Section>

        {policy.allow_instructor_custom !== false && (<Section title={t('customize')} hint={t('tip_customize')}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={customOn} onChange={(e) => setCustomOn(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            <span className="text-sm text-slate-700">{t('customize_toggle')}</span>
          </label>
          {customOn && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('cust_modules')}</label>
                <input type="number" min={policy.min_modules} max={policy.max_modules} value={cMods} onChange={(e) => setCMods(Math.min(policy.max_modules, Math.max(policy.min_modules, parseInt(e.target.value) || 1)))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-center font-semibold focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('cust_lessons')}</label>
                <input type="number" min={policy.min_lessons} max={policy.max_lessons} value={cLessons} onChange={(e) => setCLessons(Math.min(policy.max_lessons, Math.max(policy.min_lessons, parseInt(e.target.value) || 1)))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-center font-semibold focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('cust_minutes')}</label>
                <select value={cMins} onChange={(e) => setCMins(parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-center font-semibold focus:outline-none focus:border-brand-400">
                  {(policy.allowed_minutes || [5, 10, 15, 20, 25, 30, 45, 60]).map((m: number) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
          {customOn && <p className="text-xs text-slate-500 mt-2">{t('cust_hint', { n: cMods * cLessons })}</p>}
        </Section>)}

        <Section title={t('tone_label')} hint={t('tip_tone')}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONES.map(([v, l]) => (
              <button key={v} onClick={() => setTone(v)}
                className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${tone === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t('cc_category')} hint={t('cc_category_hint')}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400">
            <option value="" disabled>{t('cc_category_ph')}</option>
            <optgroup label={t('cc_cat_areas')}>
              {cats.filter((c: any) => !c.parent).map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </optgroup>
            <optgroup label={t('cc_cat_ia_pratica')}>
              {cats.filter((c: any) => c.parent === 'ia' && c.track === 'pratica').map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </optgroup>
            <optgroup label={t('cc_cat_ia_avancada')}>
              {cats.filter((c: any) => c.parent === 'ia' && c.track === 'avancada').map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </optgroup>
          </select>
        </Section>

        <Section title={t('types_label')} hint={t('tip_types')}>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
              <input type="checkbox" checked readOnly className="w-5 h-5 rounded text-brand-600 accent-brand-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-900">{t('type.reading')}</div>
                <div className="text-xs text-slate-500">{t('type.reading_hint')}</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
              <input type="checkbox" checked={includeVideo} onChange={(e) => setIncludeVideo(e.target.checked)} className="w-5 h-5 rounded text-brand-600 accent-brand-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-900">{t('type.video')}</div>
                <div className="text-xs text-slate-500">{t('type.video_hint')}</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
              <input type="checkbox" checked={includeExercises} onChange={(e) => setIncludeExercises(e.target.checked)} className="w-5 h-5 rounded text-brand-600 accent-brand-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-900">{t('type.exercise')}</div>
                <div className="text-xs text-slate-500">{t('type.exercise_hint')}</div>
              </div>
            </label>
          </div>
        </Section>

        <div className="pt-2">
          <button onClick={startGeneration} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-2xl text-base shadow">
            {t('generate_btn')}
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">{t('generate_hint')}</p>
        </div>
      </div>
    );
  }

  if (phase === 'generating') {
    const pct = job && job.progress_total > 0 ? Math.round((job.progress_done / job.progress_total) * 100) : 0;
    return (
      <div className="py-16 text-center">
        <div className="text-6xl mb-6 animate-pulse">🧠</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('building')}</h2>
        <p className="text-sm text-slate-500 mb-2">{job?.current_step || t('starting')}</p>
        <p className="text-xs text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">{t('building_hint')}</p>

        {job && job.progress_total > 0 && (
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-500 tabular-nums">{t('progress', { done: job.progress_done, total: job.progress_total, pct })}</div>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          {t('gen_explainer')}
        </p>
      </div>
    );
  }

  if (phase === 'review' && course) {
    return (
      <div className="pb-16">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {t('generated_badge')}
            </span>
            <span className="text-xs text-slate-400">{t('edit_before')}</span>
          </div>
        </div>

        {course.hero_image_url && (
          <div className="rounded-2xl overflow-hidden mb-6 aspect-[21/9] bg-slate-100">
            <img src={course.hero_image_url} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}

        <EditableField label={t('f_title')} value={course.title} onSave={(v) => saveCourseMeta({ title: v })} large saving={savingMeta} />
        <EditableField label={t('f_subtitle')} value={course.subtitle || ''} onSave={(v) => saveCourseMeta({ subtitle: v })} saving={savingMeta} />
        <EditableField label={t('f_description')} value={course.description || ''} onSave={(v) => saveCourseMeta({ description: v })} multiline saving={savingMeta} />

        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('modules_summary', { m: course.modules.length, l: course.modules.reduce((s,m) => s + m.lessons.length, 0) })}</h3>
          <div className="space-y-3">
            {course.modules.map((mod, mi) => (
              <details key={mod.id || mi} className="bg-white border border-slate-200 rounded-xl overflow-hidden group">
                <summary className="px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">{mi + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate">{mod.title}</div>
                    <div className="text-xs text-slate-500">{t('lessons_short', { n: mod.lessons.length })}</div>
                  </div>
                  <span className="text-slate-400 text-xs group-open:rotate-90 transition-transform">▶</span>
                </summary>
                <div className="border-t border-slate-100 bg-slate-50/50">
                  {mod.lessons.map((l, li) => (
                    <div key={l.id || li} className="px-4 py-2.5 border-b border-slate-100 last:border-0 flex items-center gap-3 text-sm">
                      <span className="text-xs text-slate-400 font-mono tabular-nums w-6">{li + 1}.</span>
                      <span className="flex-1 text-slate-700 truncate">{l.title}</span>
                      <span className="text-xs text-slate-400">{t('min_short', { n: l.duration_minutes })}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <button onClick={() => router.push(`/teach/curso/${course.id}` as any)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl border-2 border-slate-200">
            {t('continue_editing')}
          </button>
          <button onClick={publishOrSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow">
            {t('publish_submit')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{title}</h3>
      {hint && <p className="text-xs text-slate-500 -mt-1 mb-3 leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

function EditableField({ label, value, onSave, multiline, large, saving }: {
  label: string; value: string; onSave: (v: string) => void; multiline?: boolean; large?: boolean; saving?: boolean;
}) {
  const t = useTranslations('create_course');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (!editing) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          <button onClick={() => setEditing(true)} className="text-xs text-brand-600 hover:underline">{t('edit')}</button>
        </div>
        <div className={`${large ? 'text-2xl sm:text-3xl font-bold text-slate-900 leading-tight' : multiline ? 'text-slate-700 leading-relaxed whitespace-pre-wrap' : 'text-slate-900 font-medium'}`}>{value || <span className="text-slate-400 italic font-normal text-base">{t('empty_field')}</span>}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {multiline ? (
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} className="mt-1 w-full p-3 border-2 border-brand-300 rounded-xl outline-none focus:border-brand-500" autoFocus />
      ) : (
        <input value={draft} onChange={(e) => setDraft(e.target.value)} className={`mt-1 w-full p-3 border-2 border-brand-300 rounded-xl outline-none focus:border-brand-500 ${large ? 'text-xl font-bold' : ''}`} autoFocus />
      )}
      <div className="mt-2 flex gap-2 justify-end">
        <button onClick={() => { setDraft(value); setEditing(false); }} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5">{t('cancel')}</button>
        <button onClick={() => { onSave(draft); setEditing(false); }} disabled={saving} className="text-sm bg-brand-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 font-semibold">
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}

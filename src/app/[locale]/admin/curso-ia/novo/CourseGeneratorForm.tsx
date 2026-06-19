'use client';

import { useMemo, useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const EMOJIS = ['📚','🤖','🧠','💡','📊','🎨','⚙️','🚀','📈','🔬','💬','🎯','📝','🎓','🛠','🔮','💼','🌐'];

const LEVELS: { v: 'beginner' | 'intermediate' | 'advanced'; labelKey: string; descKey: string }[] = [
  { v: 'beginner', labelKey: 'cgf.lvl_beginner', descKey: 'cgf.lvl_beginner_desc' },
  { v: 'intermediate', labelKey: 'cgf.lvl_intermediate', descKey: 'cgf.lvl_intermediate_desc' },
  { v: 'advanced', labelKey: 'cgf.lvl_advanced', descKey: 'cgf.lvl_advanced_desc' },
];

const TONES: { v: 'didactic' | 'technical' | 'practical' | 'inspirational'; labelKey: string; descKey: string; emoji: string }[] = [
  { v: 'didactic', labelKey: 'cgf.tone_didactic', descKey: 'cgf.tone_didactic_desc', emoji: '🎓' },
  { v: 'technical', labelKey: 'cgf.tone_technical', descKey: 'cgf.tone_technical_desc', emoji: '⚙️' },
  { v: 'practical', labelKey: 'cgf.tone_practical', descKey: 'cgf.tone_practical_desc', emoji: '🛠' },
  { v: 'inspirational', labelKey: 'cgf.tone_inspirational', descKey: 'cgf.tone_inspirational_desc', emoji: '✨' },
];

const DEPTHS: { v: 'summary' | 'normal' | 'extensive'; labelKey: string; descKey: string }[] = [
  { v: 'summary', labelKey: 'cgf.depth_summary', descKey: 'cgf.depth_summary_desc' },
  { v: 'normal', labelKey: 'cgf.depth_normal', descKey: 'cgf.depth_normal_desc' },
  { v: 'extensive', labelKey: 'cgf.depth_extensive', descKey: 'cgf.depth_extensive_desc' },
];

const COURSE_TYPES: { v: 'essential' | 'ai_generated'; labelKey: string; descKey: string }[] = [
  { v: 'essential', labelKey: 'cgf.ct_essential', descKey: 'cgf.ct_essential_desc' },
  { v: 'ai_generated', labelKey: 'cgf.ct_ai_gen', descKey: 'cgf.ct_ai_gen_desc' },
];

const FORMATS: { v: string; labelKey: string; emoji: string }[] = [
  { v: 'reading', labelKey: 'cgf.fmt_reading', emoji: '📖' },
  { v: 'video', labelKey: 'cgf.fmt_video', emoji: '🎬' },
  { v: 'exercise', labelKey: 'cgf.fmt_exercise', emoji: '✍️' },
];

const LANGUAGES: { v: string; labelKey: string }[] = [
  { v: 'pt', labelKey: 'cgf.lang_pt' },
  { v: 'en', labelKey: 'cgf.lang_en' },
  { v: 'es', labelKey: 'cgf.lang_es' },
  { v: 'fr', labelKey: 'cgf.lang_fr' },
];

function suggestPrice(numModules: number, lessonsPerModule: number, avgMinutes: number, level: string, courseType: string): number {
  if (courseType === 'essential') return 0;
  const totalHours = (numModules * lessonsPerModule * avgMinutes) / 60;
  const levelMult: Record<string, number> = { beginner: 1, intermediate: 1.3, advanced: 1.7 };
  const baseHourPrice = 15;
  const raw = totalHours * baseHourPrice * (levelMult[level] || 1);
  const rounded = Math.max(19, Math.round(raw / 10) * 10 - 1);
  return Math.min(rounded, 299);
}

export function CourseGeneratorForm() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const sb = createClient(); const { data } = await sb.rpc('nl_course_categories_list', { p_lang: locale }); if (Array.isArray(data)) setCats(data); } catch {} })(); }, [locale]);
  const [submitting, setSubmitting] = useState(false);

  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('pt');
  const [emoji, setEmoji] = useState('📚');
  const [category, setCategory] = useState('');
  const [courseType, setCourseType] = useState<'essential' | 'ai_generated'>('essential');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [tone, setTone] = useState<'didactic' | 'technical' | 'practical' | 'inspirational'>('didactic');
  const [depth, setDepth] = useState<'summary' | 'normal' | 'extensive'>('normal');
  const [numModules, setNumModules] = useState(5);
  const [lessonsPerModule, setLessonsPerModule] = useState(4);
  const [avgMinutes, setAvgMinutes] = useState(15);
  const [formats, setFormats] = useState<string[]>(['reading', 'exercise']);
  const [priorityTopics, setPriorityTopics] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');

  const totalLessons = numModules * lessonsPerModule;
  const totalHours = (totalLessons * avgMinutes) / 60;
  const suggestedPrice = useMemo(() => suggestPrice(numModules, lessonsPerModule, avgMinutes, level, courseType), [numModules, lessonsPerModule, avgMinutes, level, courseType]);

  function toggleFormat(f: string) {
    setFormats((curr) => curr.includes(f) ? (curr.length > 1 ? curr.filter((x) => x !== f) : curr) : [...curr, f]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { toast.error(t('cgf.toast_topic_required')); return; }
    if (formats.length === 0) { toast.error(t('cgf.toast_format_required')); return; }
    if (!category) { toast.error(t('cgf.category_ph')); return; }
    setSubmitting(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { toast.error(t('cgf.toast_admin_required')); setSubmitting(false); return; }

      const config = {
        topic: topic.trim(),
        level, num_modules: numModules, lessons_per_module: lessonsPerModule,
        avg_lesson_minutes: avgMinutes,
        tone, depth, formats, emoji, category, course_type: courseType, language,
        priority_topics: priorityTopics.split('\n').map((s) => s.trim()).filter(Boolean),
        extra_instructions: extraInstructions.trim() || undefined,
      };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-full-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || t('cgf.toast_gen_failed'));
      toast.success(t('cgf.toast_gen_started'));
      router.push(`/admin/curso-ia/${data.job_id}` as any);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      <AdminPageHeader
        backHref="/admin/cursos"
        backLabel={t('cgf.back')}
        title={t('cgf.title')}
        description={t('cgf.subtitle')}
        related={[
          { href: '/admin/cursos', label: 'Cursos', emoji: '📚' },
          { href: '/admin/learning-paths', label: 'Percursos', emoji: '🛤️' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('cgf.card1')}</h2>
          <div>
            <label className="label">{t('cgf.topic_label')}</label>
            <textarea
              className="input min-h-[80px]"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('cgf.topic_placeholder')}
              required
            />
            <p className="text-xs text-slate-400 mt-1">{t('cgf.topic_hint')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_120px_120px] gap-4">
            <div>
              <label className="label">{t('cgf.language')}</label>
              <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.v} value={l.v}>{t(l.labelKey)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('cgf.category')}</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>{t('cgf.category_ph')}</option>
                <optgroup label={t('cgf.cat_areas')}>
                  {cats.filter((c: any) => !c.parent).map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </optgroup>
                <optgroup label={t('cgf.cat_ia_pratica')}>
                  {cats.filter((c: any) => c.parent === 'ia' && c.track === 'pratica').map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </optgroup>
                <optgroup label={t('cgf.cat_ia_avancada')}>
                  {cats.filter((c: any) => c.parent === 'ia' && c.track === 'avancada').map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="label">{t('cgf.emoji')}</label>
              <select className="input text-xl" value={emoji} onChange={(e) => setEmoji(e.target.value)}>
                {EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('cgf.course_type')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COURSE_TYPES.map((ct) => (
                <button key={ct.v} type="button" onClick={() => setCourseType(ct.v)} className={`text-left p-3 rounded-lg border transition-all ${courseType === ct.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-medium text-sm text-slate-900">{t(ct.labelKey)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t(ct.descKey)}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('cgf.card2')}</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t('cgf.modules')}</label>
              <input type="number" min="1" max="12" className="input text-center text-lg font-semibold" value={numModules} onChange={(e) => setNumModules(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))} />
            </div>
            <div>
              <label className="label">{t('cgf.lessons_per')}</label>
              <input type="number" min="1" max="10" className="input text-center text-lg font-semibold" value={lessonsPerModule} onChange={(e) => setLessonsPerModule(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} />
            </div>
            <div>
              <label className="label">{t('cgf.min_per_lesson')}</label>
              <select className="input text-center text-lg font-semibold" value={avgMinutes} onChange={(e) => setAvgMinutes(parseInt(e.target.value))}>
                {[5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div><div className="font-semibold text-slate-900">{totalLessons}</div><div className="text-xs text-slate-500">{t('cgf.total_lessons')}</div></div>
            <div><div className="font-semibold text-slate-900">{totalHours.toFixed(1)}h</div><div className="text-xs text-slate-500">{t('cgf.total_duration')}</div></div>
            <div><div className="font-semibold text-slate-900">{courseType === 'essential' ? t('cgf.free') : `€${suggestedPrice}`}</div><div className="text-xs text-slate-500">{t('cgf.suggested_price')}</div></div>
          </div>
          {courseType === 'ai_generated' && (
            <p className="text-xs text-slate-500">{t('cgf.price_hint')}</p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('cgf.card3')}</h2>
          <div>
            <label className="label">{t('cgf.level')}</label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button key={l.v} type="button" onClick={() => setLevel(l.v)} className={`p-3 rounded-lg border text-left transition-all ${level === l.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-medium text-sm text-slate-900">{t(l.labelKey)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t(l.descKey)}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('cgf.tone')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONES.map((tn) => (
                <button key={tn.v} type="button" onClick={() => setTone(tn.v)} className={`p-3 rounded-lg border text-left transition-all ${tone === tn.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-lg">{tn.emoji}</div>
                  <div className="font-medium text-sm text-slate-900 mt-1">{t(tn.labelKey)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{t(tn.descKey)}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('cgf.depth')}</label>
            <div className="grid grid-cols-3 gap-2">
              {DEPTHS.map((d) => (
                <button key={d.v} type="button" onClick={() => setDepth(d.v)} className={`p-3 rounded-lg border text-left transition-all ${depth === d.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-medium text-sm text-slate-900">{t(d.labelKey)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t(d.descKey)}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('cgf.formats')}</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button key={f.v} type="button" onClick={() => toggleFormat(f.v)} className={`p-3 rounded-lg border text-center transition-all ${formats.includes(f.v) ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-2xl">{f.emoji}</div>
                  <div className="font-medium text-sm text-slate-900 mt-1">{t(f.labelKey)}</div>
                  {formats.includes(f.v) && <div className="text-[10px] text-brand-600 font-bold mt-0.5">{t('cgf.included')}</div>}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('cgf.card4')}</h2>
          <div>
            <label className="label">{t('cgf.priority_topics')}</label>
            <textarea className="input min-h-[80px]" value={priorityTopics} onChange={(e) => setPriorityTopics(e.target.value)} placeholder={t('cgf.priority_placeholder')} />
            <p className="text-xs text-slate-400 mt-1">{t('cgf.priority_topics_hint')}</p>
          </div>
          <div>
            <label className="label">{t('cgf.extra')}</label>
            <textarea className="input min-h-[60px]" value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)} placeholder={t('cgf.extra_placeholder')} />
          </div>
        </section>

        <div className="sticky bottom-4 z-10">
          <button type="submit" disabled={submitting || !topic.trim()} className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold py-3.5 rounded-xl shadow-lg disabled:opacity-50 hover:shadow-xl transition-all">
            {submitting ? t('cgf.submit_starting') : t('cgf.submit_label', { n: totalLessons, m: Math.ceil(totalLessons * 0.7) })}
          </button>
        </div>
      </form>
    </div>
  );
}

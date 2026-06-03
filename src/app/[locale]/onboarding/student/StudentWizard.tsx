'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';

interface Step {
  id: string;
  step_key: string;
  step_order: number;
  required: boolean;
  skippable: boolean;
  points: number;
  icon: string;
  estimated_seconds: number | null;
  title: string;
  description: string | null;
  cta_label: string | null;
  skip_label: string | null;
}

interface Progress {
  step_key: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  data: Record<string, unknown> | null;
}

interface CuratedLesson {
  course: { id: string; title: string; subtitle: string | null; emoji: string | null; category: string | null; level: string | null };
  lesson: { module_index: number; lesson_index: number; title: string; objective: string | null; duration_minutes: number; type: string | null };
}

const INTEREST_TOPICS = [
  { slug: 'ai', emoji: '🤖' }, { slug: 'ml', emoji: '🧠' }, { slug: 'data', emoji: '📊' },
  { slug: 'design', emoji: '🎨' }, { slug: 'web', emoji: '🌐' }, { slug: 'mobile', emoji: '📱' },
  { slug: 'devops', emoji: '⚙️' }, { slug: 'product', emoji: '🚀' }, { slug: 'leadership', emoji: '🧭' },
  { slug: 'business', emoji: '💼' }, { slug: 'security', emoji: '🔒' }, { slug: 'cloud', emoji: '☁️' },
] as const;

const GOALS = [
  { slug: 'career', emoji: '📈' }, { slug: 'side_project', emoji: '🛠️' },
  { slug: 'team', emoji: '👥' }, { slug: 'curiosity', emoji: '🔭' },
] as const;

export function StudentWizard() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  // Curated starter lesson
  const [curated, setCurated] = useState<CuratedLesson | null>(null);
  const [curatedLoading, setCuratedLoading] = useState(false);
  const [curatedFetched, setCuratedFetched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login' as any); return; }
      if (cancelled) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('nl_profiles')
        .select('interests, goal, onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.interests) setSelectedInterests(profile.interests);
      if (profile?.goal) setSelectedGoal(profile.goal);

      if (profile?.onboarding_completed_at) {
        router.replace('/' as any);
        return;
      }

      const { data: stepRows } = await supabase
        .from('nl_onboarding_flows')
        .select(`id, step_key, step_order, required, skippable, points, icon, estimated_seconds,
          nl_onboarding_flows_i18n!inner(title, description, cta_label, skip_label, lang)`)
        .eq('kind', 'student')
        .eq('nl_onboarding_flows_i18n.lang', locale)
        .order('step_order');

      type StepRow = {
        id: string; step_key: string; step_order: number; required: boolean; skippable: boolean;
        points: number; icon: string; estimated_seconds: number | null;
        nl_onboarding_flows_i18n: Array<{ title: string; description: string | null; cta_label: string | null; skip_label: string | null }>;
      };
      const mapped: Step[] = ((stepRows as unknown as StepRow[]) || []).map((s) => ({
        id: s.id, step_key: s.step_key, step_order: s.step_order,
        required: s.required, skippable: s.skippable, points: s.points,
        icon: s.icon, estimated_seconds: s.estimated_seconds,
        title: s.nl_onboarding_flows_i18n[0]?.title ?? s.step_key,
        description: s.nl_onboarding_flows_i18n[0]?.description ?? null,
        cta_label: s.nl_onboarding_flows_i18n[0]?.cta_label ?? null,
        skip_label: s.nl_onboarding_flows_i18n[0]?.skip_label ?? null,
      }));
      setSteps(mapped);

      const { data: progRows } = await supabase
        .from('nl_onboarding_progress')
        .select('step_key, status, data')
        .eq('user_id', user.id)
        .eq('kind', 'student');
      const pmap: Record<string, Progress> = {};
      (progRows || []).forEach((p) => { pmap[p.step_key] = p as Progress; });
      setProgress(pmap);

      const firstIncomplete = mapped.findIndex((s) => !pmap[s.step_key] || (pmap[s.step_key].status !== 'completed' && pmap[s.step_key].status !== 'skipped'));
      setCurrentIdx(firstIncomplete === -1 ? mapped.length - 1 : firstIncomplete);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [supabase, router, locale]);

  // Pré-carregar aula curada quando o user chega ao step "first_lesson" (ou perto)
  const current = steps[currentIdx];
  useEffect(() => {
    if (!current || curatedFetched) return;
    if (current.step_key !== 'first_lesson') return;
    setCuratedLoading(true);
    setCuratedFetched(true);
    (async () => {
      try {
        const { data, error } = await supabase.rpc('nl_pick_curated_starter_lesson', { p_lang: locale });
        if (error) {
          console.error('curated_lesson_error', error);
          setCurated(null);
        } else if (data?.ok) {
          setCurated({ course: data.course, lesson: data.lesson });
        } else {
          setCurated(null);
        }
      } catch (e) {
        console.error('curated_lesson_exception', e);
        setCurated(null);
      } finally {
        setCuratedLoading(false);
      }
    })();
  }, [current, supabase, locale, curatedFetched]);

  async function saveProgress(stepKey: string, status: Progress['status'], data: Record<string, unknown> | null) {
    if (!userId) return;
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from('nl_onboarding_progress').upsert({
      user_id: userId, kind: 'student', step_key: stepKey,
      status, data, started_at: now,
      completed_at: status === 'completed' || status === 'skipped' ? now : null,
      updated_at: now,
    }, { onConflict: 'user_id,kind,step_key' });
    if (error) toast.error(error.message);
    setProgress((p) => ({ ...p, [stepKey]: { step_key: stepKey, status, data } }));
    setSaving(false);
  }

  async function persistProfile(patch: Record<string, unknown>) {
    if (!userId) return;
    const { error } = await supabase.from('nl_profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', userId);
    if (error) toast.error(error.message);
  }

  async function finish() {
    if (!userId) return;
    setSaving(true);
    await persistProfile({ onboarding_completed_at: new Date().toISOString() });
    toast.success(t('onboarding.completed_toast'));
    router.replace('/' as any);
  }

  async function handleContinue() {
    if (!current) return;

    if (current.step_key === 'interests') {
      if (selectedInterests.length < 1) { toast.error(t('onboarding.pick_at_least_one')); return; }
      await persistProfile({ interests: selectedInterests });
      await saveProgress('interests', 'completed', { interests: selectedInterests });
      // Reset curated cache (interests podem ter mudado, próxima vez recurar)
      setCuratedFetched(false);
      setCurated(null);
    } else if (current.step_key === 'goal') {
      if (!selectedGoal) { toast.error(t('onboarding.pick_goal')); return; }
      await persistProfile({ goal: selectedGoal });
      await saveProgress('goal', 'completed', { goal: selectedGoal });
    } else if (current.step_key === 'first_lesson' && curated) {
      // Marca step completed E navega para a aula curada
      await saveProgress('first_lesson', 'completed', {
        course_id: curated.course.id,
        module_index: curated.lesson.module_index,
        lesson_index: curated.lesson.lesson_index,
      });
      router.push(`/learn/curso/${curated.course.id}/aula/${curated.lesson.module_index}/${curated.lesson.lesson_index}` as any);
      return;
    } else {
      await saveProgress(current.step_key, 'completed', null);
    }

    if (currentIdx >= steps.length - 1) { await finish(); return; }
    setCurrentIdx((i) => i + 1);
  }

  async function handleSkip() {
    if (!current) return;
    await saveProgress(current.step_key, 'skipped', null);
    if (currentIdx >= steps.length - 1) { await finish(); return; }
    setCurrentIdx((i) => i + 1);
  }

  async function handleLinkStep(target: string) {
    if (!current) return;
    await saveProgress(current.step_key, 'completed', { redirected_to: target });
    router.push(target as any);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">{t('onboarding.loading')}</div>
      </div>
    );
  }

  if (!current) return null;

  const pct = Math.round((currentIdx / Math.max(steps.length - 1, 1)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{t('onboarding.step_x_of_y', { x: currentIdx + 1, y: steps.length })}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
          </div>
          <div className="mt-3 flex justify-center gap-1.5">
            {steps.map((s, i) => (
              <button key={s.step_key} onClick={() => setCurrentIdx(i)} aria-label={s.step_key}
                className={`text-xs px-2 py-0.5 rounded-full transition-all ${i === currentIdx ? 'bg-slate-900 text-white' : progress[s.step_key]?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : progress[s.step_key]?.status === 'skipped' ? 'bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 text-slate-500'}`}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-4xl mb-3" aria-hidden>{current.icon}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{current.title}</h1>
          {current.description && <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">{current.description}</p>}

          {/* Step bodies */}
          <div className="mt-6">
            {current.step_key === 'welcome' && (
              <div className="space-y-4">
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-3"><span className="text-emerald-500 flex-shrink-0">✓</span>{t('onboarding.welcome.b1')}</li>
                  <li className="flex gap-3"><span className="text-emerald-500 flex-shrink-0">✓</span>{t('onboarding.welcome.b2')}</li>
                  <li className="flex gap-3"><span className="text-emerald-500 flex-shrink-0">✓</span>{t('onboarding.welcome.b3')}</li>
                </ul>
              </div>
            )}

            {current.step_key === 'interests' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTEREST_TOPICS.map((topic) => {
                  const active = selectedInterests.includes(topic.slug);
                  return (
                    <button key={topic.slug} onClick={() => setSelectedInterests((s) => active ? s.filter((x) => x !== topic.slug) : [...s, topic.slug])}
                      className={`text-sm px-3 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${active ? 'border-brand-500 bg-brand-50 text-brand-900 font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                      <span className="text-lg">{topic.emoji}</span>
                      <span>{t(`onboarding.interests.${topic.slug}`)}</span>
                    </button>
                  );
                })}
                <p className="col-span-full text-xs text-slate-500 mt-2">{t('onboarding.interests_count', { n: selectedInterests.length })}</p>
              </div>
            )}

            {current.step_key === 'goal' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const active = selectedGoal === g.slug;
                  return (
                    <button key={g.slug} onClick={() => setSelectedGoal(g.slug)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="text-2xl mb-2">{g.emoji}</div>
                      <div className={`font-semibold ${active ? 'text-brand-900' : 'text-slate-900'}`}>{t(`onboarding.goals.${g.slug}.title`)}</div>
                      <div className="text-xs text-slate-600 mt-1">{t(`onboarding.goals.${g.slug}.desc`)}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {current.step_key === 'first_lesson' && (
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-brand-50 border border-violet-100 p-5">
                {curatedLoading ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      {t('onboarding.first_lesson.loading')}
                    </div>
                  </div>
                ) : curated ? (
                  <>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-violet-600 mb-3">
                      ✨ {t('onboarding.first_lesson.curated_label')}
                    </div>
                    <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-violet-100">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl flex-shrink-0">{curated.course.emoji || '📚'}</div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 leading-tight">{curated.lesson.title}</h3>
                          <div className="text-xs text-slate-500 mt-1">
                            {t('onboarding.first_lesson.from_course')} · {curated.course.title}
                          </div>
                          {curated.lesson.objective && (
                            <p className="text-sm text-slate-700 mt-3 leading-relaxed">{curated.lesson.objective}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                            <span>⏱ {t('onboarding.first_lesson.minutes', { n: curated.lesson.duration_minutes })}</span>
                            {curated.course.level && <><span>·</span><span className="capitalize">{curated.course.level}</span></>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-700 mb-4">{t('onboarding.first_lesson.no_lesson')}</p>
                    <button onClick={() => handleLinkStep('/cursos')} className="text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg">
                      📚 {t('onboarding.first_lesson.cta')}
                    </button>
                  </>
                )}
              </div>
            )}

            {current.step_key === 'first_course' && (
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-brand-50 border border-emerald-100 p-5">
                <p className="text-sm text-slate-700 mb-4">{t('onboarding.first_course.body')}</p>
                <button onClick={() => handleLinkStep('/cursos')} className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
                  ✨ {t('onboarding.first_course.cta')}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-between gap-3">
            {current.skippable && current.skip_label ? (
              <button onClick={handleSkip} disabled={saving} className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50">
                {current.skip_label}
              </button>
            ) : <span />}
            <button
              onClick={handleContinue}
              disabled={saving || (current.step_key === 'first_lesson' && curatedLoading)}
              className="bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-50"
            >
              {saving
                ? t('onboarding.saving')
                : current.step_key === 'first_lesson' && curated
                  ? t('onboarding.first_lesson.see_lesson_btn')
                  : (current.cta_label || t('onboarding.continue'))}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">+{current.points} {t('onboarding.points_for_step')}</p>
      </div>
    </div>
  );
}

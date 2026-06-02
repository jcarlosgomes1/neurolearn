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

const EXPERTISE_TOPICS = [
  { slug: 'ai', emoji: '🤖' },
  { slug: 'ml', emoji: '🧠' },
  { slug: 'data', emoji: '📊' },
  { slug: 'design', emoji: '🎨' },
  { slug: 'web', emoji: '🌐' },
  { slug: 'mobile', emoji: '📱' },
  { slug: 'devops', emoji: '⚙️' },
  { slug: 'product', emoji: '🚀' },
  { slug: 'leadership', emoji: '🧭' },
  { slug: 'business', emoji: '💼' },
  { slug: 'security', emoji: '🔒' },
  { slug: 'cloud', emoji: '☁️' },
] as const;

const COUNTRIES = ['PT', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'IE', 'GB', 'US', 'BR', 'Other'] as const;

export function InstructorWizard() {
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

  // Step-specific state
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [iban, setIban] = useState('');
  const [holderName, setHolderName] = useState('');
  const [country, setCountry] = useState<string>('PT');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login' as any); return; }
      if (cancelled) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('nl_profiles')
        .select('bio, avatar_url, interests, role, onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.bio) setBio(profile.bio);
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile?.interests) setExpertise(profile.interests);
      if (profile?.onboarding_completed_at) {
        router.replace('/' as any);
        return;
      }
      // If somehow a non-instructor lands here, send them to student onboarding
      if (profile && profile.role && !['instructor','admin','super_admin'].includes(profile.role)) {
        router.replace('/onboarding/student' as any);
        return;
      }

      const { data: stepRows } = await supabase
        .from('nl_onboarding_flows')
        .select(`id, step_key, step_order, required, skippable, points, icon, estimated_seconds,
          nl_onboarding_flows_i18n!inner(title, description, cta_label, skip_label, lang)`)
        .eq('kind', 'instructor')
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
        .eq('kind', 'instructor');
      const pmap: Record<string, Progress> = {};
      (progRows || []).forEach((p) => {
        pmap[p.step_key] = p as Progress;
        // Restore form data from progress
        if (p.step_key === 'payout_info' && p.data) {
          const d = p.data as Record<string, unknown>;
          if (typeof d.iban === 'string') setIban(d.iban);
          if (typeof d.holder_name === 'string') setHolderName(d.holder_name);
          if (typeof d.country === 'string') setCountry(d.country);
        }
      });
      setProgress(pmap);

      const firstIncomplete = mapped.findIndex((s) => !pmap[s.step_key] || (pmap[s.step_key].status !== 'completed' && pmap[s.step_key].status !== 'skipped'));
      setCurrentIdx(firstIncomplete === -1 ? mapped.length - 1 : firstIncomplete);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [supabase, router, locale]);

  const current = steps[currentIdx];

  async function saveProgress(stepKey: string, status: Progress['status'], data: Record<string, unknown> | null) {
    if (!userId) return;
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from('nl_onboarding_progress').upsert({
      user_id: userId, kind: 'instructor', step_key: stepKey,
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
    router.replace('/admin' as any);
  }

  async function handleContinue() {
    if (!current) return;

    if (current.step_key === 'profile_bio') {
      if (bio.trim().length < 30) { toast.error(t('onboarding_ins.bio_too_short')); return; }
      await persistProfile({ bio, avatar_url: avatarUrl || null });
      await saveProgress('profile_bio', 'completed', { bio_length: bio.length, has_avatar: !!avatarUrl });
    } else if (current.step_key === 'expertise') {
      if (expertise.length < 1) { toast.error(t('onboarding.pick_at_least_one')); return; }
      await persistProfile({ interests: expertise });
      await saveProgress('expertise', 'completed', { expertise });
    } else if (current.step_key === 'payout_info') {
      const trimmed = iban.replace(/\s+/g, '');
      if (trimmed && trimmed.length < 15) { toast.error(t('onboarding_ins.iban_invalid')); return; }
      await saveProgress('payout_info', 'completed', { iban: trimmed, holder_name: holderName, country });
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
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{t('onboarding.step_x_of_y', { x: currentIdx + 1, y: steps.length })}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
          </div>
          <div className="mt-3 flex justify-center gap-1.5 flex-wrap">
            {steps.map((s, i) => (
              <button key={s.step_key} onClick={() => setCurrentIdx(i)} aria-label={s.step_key}
                className={`text-xs px-2 py-0.5 rounded-full transition-all ${i === currentIdx ? 'bg-slate-900 text-white' : progress[s.step_key]?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : progress[s.step_key]?.status === 'skipped' ? 'bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 text-slate-500'}`}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-4xl mb-3" aria-hidden>{current.icon}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{current.title}</h1>
          {current.description && <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">{current.description}</p>}

          <div className="mt-6">
            {current.step_key === 'welcome' && (
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex gap-3"><span className="text-emerald-500 flex-shrink-0">✓</span>{t('onboarding_ins.welcome.b1')}</li>
                <li className="flex gap-3"><span className="text-emerald-500 flex-shrink-0">✓</span>{t('onboarding_ins.welcome.b2')}</li>
                <li className="flex gap-3"><span className="text-emerald-500 flex-shrink-0">✓</span>{t('onboarding_ins.welcome.b3')}</li>
                <li className="flex gap-3"><span className="text-emerald-500 flex-shrink-0">✓</span>{t('onboarding_ins.welcome.b4')}</li>
              </ul>
            )}

            {current.step_key === 'profile_bio' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('onboarding_ins.bio_label')}</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={600}
                    placeholder={t('onboarding_ins.bio_placeholder')}
                    className="input mt-1 min-h-[140px]" />
                  <p className="text-xs text-slate-400 mt-1 tabular-nums">{bio.length} / 600</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('onboarding_ins.avatar_label')}</label>
                  <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..." className="input mt-1" />
                  {avatarUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <p className="text-xs text-slate-500">{t('onboarding_ins.avatar_preview')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {current.step_key === 'expertise' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXPERTISE_TOPICS.map((topic) => {
                  const active = expertise.includes(topic.slug);
                  return (
                    <button key={topic.slug} onClick={() => setExpertise((s) => active ? s.filter((x) => x !== topic.slug) : [...s, topic.slug])}
                      className={`text-sm px-3 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${active ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                      <span className="text-lg">{topic.emoji}</span>
                      <span>{t(`onboarding.interests.${topic.slug}`)}</span>
                    </button>
                  );
                })}
                <p className="col-span-full text-xs text-slate-500 mt-2">{t('onboarding.interests_count', { n: expertise.length })}</p>
              </div>
            )}

            {current.step_key === 'payout_info' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('onboarding_ins.holder_label')}</label>
                  <input value={holderName} onChange={(e) => setHolderName(e.target.value)} className="input mt-1" placeholder={t('onboarding_ins.holder_placeholder')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('onboarding_ins.iban_label')}</label>
                  <input value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} className="input mt-1 font-mono" placeholder="PT50 0000 0000 0000 0000 0000 0" />
                  <p className="text-xs text-slate-500 mt-1">{t('onboarding_ins.iban_hint')}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('onboarding_ins.country_label')}</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="input mt-1">
                    {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  🔒 {t('onboarding_ins.payout_security')}
                </p>
              </div>
            )}

            {current.step_key === 'generate_course' && (
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-100 p-5">
                <p className="text-sm text-slate-700 mb-4">{t('onboarding_ins.gen_course.body')}</p>
                <ul className="text-sm text-slate-700 space-y-1.5 mb-4">
                  <li className="flex gap-2"><span className="text-amber-600">⚡</span>{t('onboarding_ins.gen_course.b1')}</li>
                  <li className="flex gap-2"><span className="text-amber-600">⚡</span>{t('onboarding_ins.gen_course.b2')}</li>
                  <li className="flex gap-2"><span className="text-amber-600">⚡</span>{t('onboarding_ins.gen_course.b3')}</li>
                </ul>
                <button onClick={() => handleLinkStep('/admin/cursos')} className="text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg">
                  ⚡ {t('onboarding_ins.gen_course.cta')}
                </button>
              </div>
            )}

            {current.step_key === 'marketing_kit' && (
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-brand-50 border border-violet-100 p-5">
                <p className="text-sm text-slate-700 mb-4">{t('onboarding_ins.mkt.body')}</p>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex gap-3"><span className="text-violet-600 flex-shrink-0">📸</span>{t('onboarding_ins.mkt.b1')}</li>
                  <li className="flex gap-3"><span className="text-violet-600 flex-shrink-0">✉️</span>{t('onboarding_ins.mkt.b2')}</li>
                  <li className="flex gap-3"><span className="text-violet-600 flex-shrink-0">📣</span>{t('onboarding_ins.mkt.b3')}</li>
                </ul>
                <button onClick={() => handleLinkStep('/admin')} className="mt-4 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg">
                  {t('onboarding_ins.mkt.cta')}
                </button>
              </div>
            )}
          </div>

          <div className="mt-7 flex items-center justify-between gap-3">
            {current.skippable && current.skip_label ? (
              <button onClick={handleSkip} disabled={saving} className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50">
                {current.skip_label}
              </button>
            ) : <span />}
            <button onClick={handleContinue} disabled={saving} className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-50">
              {saving ? t('onboarding.saving') : (current.cta_label || t('onboarding.continue'))}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">+{current.points} {t('onboarding.points_for_step')}</p>
      </div>
    </div>
  );
}

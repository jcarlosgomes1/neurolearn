'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { SkillPicker, type PickerSkill } from '@/components/skills/SkillPicker';

/** Captura de skills por ID (catálogo) numa vaga: required + nice. Escreve nl_job_posting_skill. */
export function JobPostingCatalogSkills({ jobId }: { jobId: string }) {
  const t = useTranslations();
  const lang = useLocale();
  const [req, setReq] = useState<PickerSkill[]>([]);
  const [nice, setNice] = useState<PickerSkill[]>([]);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_job_posting_skills', { p_job_id: jobId, p_lang: lang });
      const items = (((data as any)?.items) || []) as any[];
      setReq(items.filter((i) => i.kind === 'required').map((i) => ({ skill_id: i.skill_id, label: i.label })));
      setNice(items.filter((i) => i.kind === 'nice').map((i) => ({ skill_id: i.skill_id, label: i.label })));
    } catch { /* noop */ }
  }, [jobId, lang]);
  useEffect(() => { load(); }, [load]);

  async function toggle(skill: PickerSkill, kind: 'required' | 'nice', add: boolean) {
    const setter = kind === 'required' ? setReq : setNice;
    setter((p) => add ? (p.some((x) => x.skill_id === skill.skill_id) ? p : [...p, skill]) : p.filter((x) => x.skill_id !== skill.skill_id));
    try { const sb = createClient(); await sb.rpc('nl_job_posting_skill_toggle', { p_job_id: jobId, p_skill_id: skill.skill_id, p_kind: kind, p_add: add }); }
    catch { toast.error(t('org.job.skill_err')); load(); }
  }

  return (
    <div className="space-y-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('org.job.catalog_req')}</label>
        <SkillPicker selected={req} onAdd={(s) => toggle(s, 'required', true)} onRemove={(id) => toggle({ skill_id: id, label: '' }, 'required', false)} lang={lang} placeholder={t('org.job.skill_search_ph')} accent="emerald" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('org.job.catalog_nice')}</label>
        <SkillPicker selected={nice} onAdd={(s) => toggle(s, 'nice', true)} onRemove={(id) => toggle({ skill_id: id, label: '' }, 'nice', false)} lang={lang} placeholder={t('org.job.skill_search_ph')} accent="sky" />
      </div>
    </div>
  );
}

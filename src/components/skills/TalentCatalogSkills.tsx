'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { SkillPicker, type PickerSkill } from '@/components/skills/SkillPicker';

/** Captura de skills por ID (catálogo canónico) para o meu perfil de talento. Escreve nl_talent_profile_skill. */
export function TalentCatalogSkills() {
  const t = useTranslations();
  const lang = useLocale();
  const [selected, setSelected] = useState<PickerSkill[]>([]);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_my_talent_skills', { p_lang: lang });
      setSelected((((data as any)?.items) || []).map((s: any) => ({ skill_id: s.skill_id, label: s.label })));
    } catch { /* noop */ }
  }, [lang]);
  useEffect(() => { load(); }, [load]);

  async function add(s: PickerSkill) {
    setSelected((p) => p.some((x) => x.skill_id === s.skill_id) ? p : [...p, s]);
    try { const sb = createClient(); await sb.rpc('nl_my_talent_skill_toggle', { p_skill_id: s.skill_id, p_add: true }); }
    catch { toast.error(t('talent.skill_err')); load(); }
  }
  async function remove(id: string) {
    setSelected((p) => p.filter((x) => x.skill_id !== id));
    try { const sb = createClient(); await sb.rpc('nl_my_talent_skill_toggle', { p_skill_id: id, p_add: false }); }
    catch { toast.error(t('talent.skill_err')); load(); }
  }

  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('talent.catalog_skills_label')}</label>
      <SkillPicker selected={selected} onAdd={add} onRemove={remove} lang={lang} placeholder={t('talent.skill_search_ph')} accent="violet" />
      <p className="text-[11px] text-slate-400 mt-1">{t('talent.catalog_hint')}</p>
    </div>
  );
}

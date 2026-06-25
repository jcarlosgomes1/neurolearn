'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

type Skill = {
  skill_id: string; code: string; label_key: string; score: number; confidence: number;
  status: string; evidence_count: number; level_code: string | null; level_label_key: string | null;
};

const LEVEL_COLOR: Record<string, string> = {
  novice: 'from-slate-400 to-slate-500',
  competent: 'from-blue-500 to-cyan-600',
  proficient: 'from-violet-500 to-indigo-600',
  expert: 'from-amber-500 to-orange-600',
};

export function MySkillsPanel() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.rpc('nl_my_skills');
        if (Array.isArray(data)) setSkills(data as Skill[]);
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, [supabase]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="">
      <AppPageHeader title={t('skills.page_title')} description={t('skills.subtitle')} />

      {skills.length === 0 ? (
        <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
          <Sparkles className="h-10 w-10 text-slate-300" />
          <span className="text-sm">{t('skills.empty')}</span>
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map((s) => {
            const grad = LEVEL_COLOR[s.level_code ?? 'novice'] ?? LEVEL_COLOR.novice;
            const validated = s.status === 'validated';
            return (
              <div key={s.skill_id} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-slate-900 truncate">{t(s.label_key as any)}</span>
                    {validated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3" /> {t('skills.validated')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        <Clock className="h-3 w-3" /> {t('skills.provisional')}
                      </span>
                    )}
                  </div>
                  {s.level_label_key && (
                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full bg-gradient-to-r ${grad}`}>
                      {t(s.level_label_key as any)}
                    </span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${grad}`} style={{ width: `${Math.max(2, Math.min(100, s.score))}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                  <span>{t('skills.confidence')}: {Math.round(s.confidence * 100)}%</span>
                  <span>{s.evidence_count} {t('skills.evidence')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

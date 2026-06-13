'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Award, TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react';

type Tier = { tier: string; i18n: string; color: string };
type ScoreBlock = { role: string; score: number; tier: Tier; breakdown: Record<string, number>; stats: Record<string, number> };
type RepData = {
  ok: boolean;
  student: ScoreBlock | null;
  instructor: ScoreBlock | null;
  optin: { show_on_marketplace: boolean; show_in_org: boolean };
};

const COLOR: Record<string, string> = {
  violet: 'from-violet-500 to-purple-600',
  emerald: 'from-emerald-500 to-teal-600',
  blue: 'from-blue-500 to-cyan-600',
  amber: 'from-amber-500 to-orange-600',
  slate: 'from-slate-400 to-slate-500',
};

export function ReputationPanel() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<RepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data: d } = await supabase.rpc('nl_reputation_my');
      if ((d as RepData)?.ok) setData(d as RepData);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function toggleMarketplace(next: boolean) {
    setSaving(true);
    try {
      await supabase.rpc('nl_reputation_optin_set', { p_marketplace: next, p_org: null });
      setData((d) => d ? { ...d, optin: { ...d.optin, show_on_marketplace: next } } : d);
    } catch { /* noop */ }
    finally { setSaving(false); }
  }

  if (loading || !data) return null;
  const blocks = [data.student, data.instructor].filter(Boolean) as ScoreBlock[];
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((b) => (
        <div key={b.role} className="bg-white rounded-2xl border border-slate-200 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-violet-600" />
              <div>
                <h3 className="font-semibold text-slate-900">{t('rep.ui.title')}</h3>
                <span className="text-xs text-slate-500">{b.role === 'instructor' ? t('rep.ui.as_instructor') : t('rep.ui.as_student')}</span>
              </div>
            </div>
            <div className={`text-3xl font-bold bg-gradient-to-br ${COLOR[b.tier.color] || COLOR.slate} bg-clip-text text-transparent tabular-nums`}>
              {b.score}<span className="text-base text-slate-400 font-medium">/100</span>
            </div>
          </div>

          <div className={`rounded-xl bg-gradient-to-r ${COLOR[b.tier.color] || COLOR.slate} p-3 mb-4`}>
            <p className="text-sm text-white font-medium leading-snug">{t(b.tier.i18n)}</p>
          </div>

          <div className="space-y-2">
            {Object.entries(b.breakdown).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-24 flex-shrink-0">{t('rep.ui.' + k)}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${COLOR[b.tier.color] || COLOR.slate} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, (v / 50) * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-600 tabular-nums w-8 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
        <div className={`flex-shrink-0 ${data.optin.show_on_marketplace ? 'text-emerald-600' : 'text-slate-400'}`}>
          {data.optin.show_on_marketplace ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900">{t('rep.ui.show_marketplace')}</div>
          <div className="text-xs text-slate-500">{t('rep.ui.show_marketplace_hint')}</div>
        </div>
        <button onClick={() => toggleMarketplace(!data.optin.show_on_marketplace)} disabled={saving}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${data.optin.show_on_marketplace ? 'bg-emerald-500' : 'bg-slate-300'}`}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin absolute top-1.5 left-4 text-white" /> :
            <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full transition-transform ${data.optin.show_on_marketplace ? 'translate-x-5' : 'translate-x-0.5'}`} />}
        </button>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Users, Cpu, FileStack, Radar, Activity, TrendingUp } from 'lucide-react';

interface Snapshot {
  ok: boolean;
  org?: { name: string; is_tenant?: boolean };
  subscription?: { plan: string; status: string | null; seats_purchased: number | null; seats_used: number | null; trial_ends_at: string | null };
  adoption?: { members_total: number; members_last_30d: number; seats_utilization_pct: number | null };
  content?: { uploads_total: number; uploads_ready: number; course_proposals: number; courses_generated: number };
  cost?: { ai_total_cents: number; ai_calls: number; current_period?: { counters?: Record<string, number>; overage_cents?: number } | null };
  signals?: Array<{ id: number; kind: string; origin_scope: string; target_market: string; detected_at: string; acted_on: boolean }>;
  recent_activity?: Array<{ event_type: string; occurred_at: string }>;
}

function eur(cents: number | null | undefined): string { return ((cents ?? 0) / 100).toFixed(2) + '€'; }

export function IntelligenceClient({ orgId }: { orgId: string }) {
  const t = useTranslations();
  const [supabase] = useState(() => createClient());
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('nl_org_intelligence_snapshot', { p_org_id: orgId });
      setSnap(data as Snapshot);
      setLoading(false);
    })();
  }, [orgId, supabase]);

  if (loading) return <div className="py-12 text-center text-slate-500 text-sm">{t('org_intel.loading')}</div>;
  if (!snap || !snap.ok) return <div className="py-12 text-center text-slate-500 text-sm">—</div>;

  const periodCost = snap.cost?.current_period?.counters?.ai_cost_cents;

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <Users className="h-5 w-5 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-slate-900">{snap.adoption?.members_total ?? 0}</div>
          <div className="text-xs text-slate-500">{t('org_intel.members')} · +{snap.adoption?.members_last_30d ?? 0} (30d)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
          <div className="text-2xl font-bold text-slate-900">{snap.adoption?.seats_utilization_pct != null ? snap.adoption.seats_utilization_pct + '%' : '—'}</div>
          <div className="text-xs text-slate-500">{t('org_intel.seats_util')} ({snap.subscription?.seats_used ?? 0}/{snap.subscription?.seats_purchased ?? '∞'})</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <FileStack className="h-5 w-5 text-violet-500 mb-2" />
          <div className="text-2xl font-bold text-slate-900">{snap.content?.courses_generated ?? 0}</div>
          <div className="text-xs text-slate-500">{t('org_intel.courses')} · {snap.content?.uploads_ready ?? 0} {t('org_intel.uploads')}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <Cpu className="h-5 w-5 text-rose-500 mb-2" />
          <div className="text-2xl font-bold text-slate-900">{eur(periodCost ?? snap.cost?.ai_total_cents)}</div>
          <div className="text-xs text-slate-500">{t('org_intel.period_cost')} · {snap.cost?.ai_calls ?? 0} {t('org_intel.ai_calls')}</div>
        </div>
      </div>

      {/* Sinais de negócio */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Radar className="h-5 w-5 text-amber-600" /> {t('org_intel.signals')}
        </h2>
        {(!snap.signals || snap.signals.length === 0) ? (
          <p className="text-sm text-slate-500">{t('org_intel.no_signals')}</p>
        ) : (
          <div className="space-y-2">
            {snap.signals.map((s) => (
              <div key={s.id} className="flex items-center gap-2 flex-wrap p-2.5 bg-amber-50 rounded-lg">
                <span className="text-xs font-semibold text-amber-800">{s.kind}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">{s.origin_scope}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{s.target_market}</span>
                {s.acted_on && <span className="text-[10px] text-slate-400">✓</span>}
                <span className="text-[10px] text-slate-400 ml-auto">{new Date(s.detected_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Atividade recente */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-600" /> {t('org_intel.activity')}
        </h2>
        {(!snap.recent_activity || snap.recent_activity.length === 0) ? (
          <p className="text-sm text-slate-500">{t('org_intel.no_activity')}</p>
        ) : (
          <div className="space-y-1.5">
            {snap.recent_activity.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                <span className="font-medium text-slate-700">{e.event_type}</span>
                <span className="text-slate-400">{new Date(e.occurred_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

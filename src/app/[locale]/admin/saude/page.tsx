import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Saúde · NeuroLearn' };

interface Finding {
  check_key: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  entity: string;
  detail: string;
  first_seen: string;
  last_seen: string;
}

const SEV_ORDER = ['critical', 'high', 'medium', 'low'] as const;
const SEV_CLS: Record<string, string> = {
  critical: 'from-red-600 to-rose-700',
  high: 'from-rose-500 to-red-600',
  medium: 'from-amber-500 to-orange-600',
  low: 'from-slate-500 to-slate-700',
};

export default async function Page() {
  const t = await getTranslations();
  let findings: Finding[] = [];
  let failed = false;

  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_admin_health_findings');
    if (error) failed = true;
    findings = Array.isArray(data) ? (data as Finding[]) : [];
  } catch {
    failed = true;
  }

  const groups = SEV_ORDER
    .map((sev) => ({ sev, items: findings.filter((f) => f.severity === sev) }))
    .filter((g) => g.items.length > 0);

  const lastScan = findings.reduce<string | null>(
    (acc, f) => (f.last_seen && (!acc || f.last_seen > acc) ? f.last_seen : acc),
    null,
  );

  const sevLabel = (sev: string) => t(`health.sev.${sev}` as any);

  return (
    <div>
      <AdminPageHeader
        emoji="🩺"
        eyebrow="Cockpit administrativo"
        title={t('health.title')}
        description={t('health.subtitle')}
      />

      {failed ? (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          {t('health.subtitle')}
        </div>
      ) : findings.length === 0 ? (
        <div className="space-y-3">
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <span>{t('health.all_clear')}</span>
          </div>
          {lastScan && (
            <div className="text-xs text-slate-400">
              {t('health.last_check')}: {new Date(lastScan).toLocaleString('pt-PT')}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-slate-500 font-medium">
              {t('health.open_issues')}: <span className="font-bold text-slate-900">{findings.length}</span>
            </div>
            {lastScan && (
              <div className="text-xs text-slate-400">
                {t('health.last_check')}: {new Date(lastScan).toLocaleString('pt-PT')}
              </div>
            )}
          </div>
          {groups.map((g) => (
            <section key={g.sev} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <header className={`px-4 py-2.5 bg-gradient-to-r ${SEV_CLS[g.sev] || SEV_CLS.low} text-white flex items-center justify-between`}>
                <span className="text-xs font-bold uppercase tracking-wider">{sevLabel(g.sev)}</span>
                <span className="text-xs font-bold bg-white/20 rounded-full px-2 py-0.5">{g.items.length}</span>
              </header>
              <ul className="divide-y divide-slate-100">
                {g.items.map((f, i) => (
                  <li key={`${f.check_key}:${f.entity}:${i}`} className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">{f.detail || f.check_key}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{f.check_key}{f.entity ? ` · ${f.entity}` : ''}</div>
                    {f.first_seen && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t('health.detected')}: {new Date(f.first_seen).toLocaleString('pt-PT')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

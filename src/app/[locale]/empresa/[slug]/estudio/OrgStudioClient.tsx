'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Upload, Sparkles, Video, BookOpen, AlertTriangle, Gauge } from 'lucide-react';

interface Quota { key: string; limit: number | null; used: number; pct: number | null; unlimited: boolean; state: string }
interface Snapshot {
  ok: boolean; plan: string | null; has_subscription: boolean;
  warn_pct: number; grace_pct: number; overage_enabled: boolean; quotas: Quota[];
}

const STATE_COLOR: Record<string, string> = {
  ok: 'bg-emerald-500', warning: 'bg-amber-500', reached: 'bg-rose-500',
  grace: 'bg-orange-500', overage: 'bg-rose-600', unlimited: 'bg-violet-400',
};

export function OrgStudioClient({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const t = useTranslations();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data } = await sb.rpc('nl_org_studio_snapshot', { p_org: orgId });
    setSnap(data as Snapshot);
    setLoading(false);
  }, [orgId]);
  useEffect(() => { load(); }, [load]);

  const anyOverage = snap?.quotas?.some((q) => q.state === 'overage' || q.state === 'grace');

  return (
    <div className="space-y-6">
      {/* Consumo do plano (política C) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2"><Gauge className="h-5 w-5 text-brand-600" /> {t('org_studio.usage')}{snap?.plan ? ` · ${snap.plan}` : ''}</h2>
          <Link href={`/empresa/${orgSlug}/upgrades` as any} className="text-xs font-semibold text-brand-600 hover:text-brand-700">{t('org_studio.upgrade')}</Link>
        </div>

        {loading && <div className="text-sm text-slate-400 py-6 text-center">…</div>}

        {!loading && snap && !snap.has_subscription && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('org_studio.no_sub')}</div>
        )}

        {!loading && snap?.has_subscription && (
          <div className="space-y-3.5">
            {snap.quotas.map((q) => {
              const label = t(('org_studio.q_' + q.key) as never) as string;
              const pct = q.unlimited ? 0 : Math.min(q.pct || 0, 100);
              return (
                <div key={q.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-800">
                      {q.unlimited ? t('org_studio.unlimited') : `${q.used} / ${q.limit}`}
                      {q.state === 'warning' && <span className="ml-2 text-amber-600 text-xs">⚠ {t('org_studio.warn')}</span>}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={'h-full rounded-full transition-all ' + (STATE_COLOR[q.state] || 'bg-slate-300')} style={{ width: q.unlimited ? '100%' : pct + '%', opacity: q.unlimited ? 0.3 : 1 }} />
                  </div>
                </div>
              );
            })}
            {anyOverage && snap.overage_enabled && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-orange-800 flex items-center gap-2 mt-2">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {t('org_studio.overage_on')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acções do estúdio */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ActionCard href={`/empresa/${orgSlug}/conteudo`} icon={Upload} color="text-blue-600 bg-blue-50" title={t('org_studio.materials_cta')} />
        <ActionCard href={`/empresa/${orgSlug}/conteudos`} icon={Sparkles} color="text-violet-600 bg-violet-50" title={t('org_studio.generate_cta')} />
        <ActionCard href={`/empresa/${orgSlug}/cursos`} icon={BookOpen} color="text-emerald-600 bg-emerald-50" title={t('org_studio.title')} />
        <ActionCard href={`/empresa/${orgSlug}/cursos`} icon={Video} color="text-rose-600 bg-rose-50" title={t('org_studio.q_streaming_minutes_per_month')} />
      </div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, color, title }: { href: string; icon: React.ElementType; color: string; title: string }) {
  return (
    <Link href={href as any} className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-brand-200 transition-all flex items-center gap-3">
      <span className={'inline-flex h-11 w-11 items-center justify-center rounded-xl ' + color + ' group-hover:scale-105 transition-transform'}><Icon className="h-5 w-5" /></span>
      <span className="font-semibold text-slate-900 text-sm">{title}</span>
    </Link>
  );
}

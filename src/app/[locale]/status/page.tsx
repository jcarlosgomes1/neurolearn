import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { CheckCircle2, AlertCircle, XCircle, Activity } from 'lucide-react';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://neurolearn-rosy.vercel.app';

export const metadata: Metadata = {
  title: 'Estado da Plataforma',
  description: 'Estado atual da plataforma NeuroLearn — saúde do sistema em tempo real.',
  alternates: { canonical: `${SITE_URL}/pt/status` },
};

interface HealthPayload {
  status: string;
  timestamp: string;
  db_size_mb?: number;
  active_users_24h?: number;
  jobs_pending?: number;
  jobs_failed_24h?: number;
  ai_calls_24h?: number;
  ai_cost_24h_eur?: number;
}

async function getHealth(): Promise<HealthPayload | null> {
  try {
    const r = await fetch(`${SITE_URL}/api/health`, { 
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok 
    ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> 
    : <AlertCircle className="h-6 w-6 text-amber-500" />;
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  const health = await getHealth();
  
  const allOk = health?.status === 'ok';
  const apiOk = !!health;
  const dbOk = apiOk && (health?.db_size_mb ?? 0) > 0;
  const jobsOk = apiOk && (health?.jobs_failed_24h ?? 0) < 50;
  
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <section className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 border-b border-slate-200/60">
          <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-7 w-7 text-brand-600" strokeWidth={2.4} />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {t('st.h1')}
              </h1>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              allOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {allOk ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="font-semibold">
                {allOk ? t('st.all_ok') : t('st.some_restricted')}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {t('st.last_check')} {health?.timestamp ? new Date(health.timestamp).toLocaleString(locale) : t('st.unavailable')}
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">{t('st.components')}</h2>
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">API</h3>
                <p className="text-sm text-slate-500 mt-0.5">{t('st.api_desc')}</p>
              </div>
              <StatusIcon ok={apiOk} />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{t('st.database')}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {dbOk ? `${t('st.db_ok')} · ${health?.db_size_mb} MB` : t('st.no_response')}
                </p>
              </div>
              <StatusIcon ok={dbOk} />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{t('st.jobs')}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {jobsOk ? t('st.jobs_ok', { pending: health?.jobs_pending ?? 0, failed: health?.jobs_failed_24h ?? 0 }) : t('st.jobs_high')}
                </p>
              </div>
              <StatusIcon ok={jobsOk} />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{t('st.engine')}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {t('st.engine_desc', { calls: health?.ai_calls_24h ?? 0, cost: (health?.ai_cost_24h_eur ?? 0).toFixed(2) })}
                </p>
              </div>
              <StatusIcon ok={apiOk} />
            </div>
          </div>

          <div className="mt-10 p-6 bg-slate-50 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-2">{t('st.about')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('st.about_pre')} <code className="bg-white px-1.5 py-0.5 rounded text-xs">/api/health</code>. {t('st.about_post')}
            </p>
          </div>
        </section>

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

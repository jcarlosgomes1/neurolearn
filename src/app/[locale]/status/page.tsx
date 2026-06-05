import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';
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
                Estado da Plataforma
              </h1>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              allOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {allOk ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="font-semibold">
                {allOk ? 'Todos os sistemas operacionais' : 'Alguns serviços a operar com restrições'}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Última verificação: {health?.timestamp ? new Date(health.timestamp).toLocaleString(locale) : 'indisponível'}
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Componentes</h2>
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">API</h3>
                <p className="text-sm text-slate-500 mt-0.5">Endpoint /api/health responde</p>
              </div>
              <StatusIcon ok={apiOk} />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Base de Dados</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {dbOk ? `Postgres responde · ${health?.db_size_mb} MB` : 'Sem resposta'}
                </p>
              </div>
              <StatusIcon ok={dbOk} />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Jobs em background</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {jobsOk ? `${health?.jobs_pending ?? 0} pending · ${health?.jobs_failed_24h ?? 0} falharam nas últimas 24h` : 'Falhas elevadas'}
                </p>
              </div>
              <StatusIcon ok={jobsOk} />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Inteligência Artificial</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {(health?.ai_calls_24h ?? 0)} chamadas · €{(health?.ai_cost_24h_eur ?? 0).toFixed(2)} (24h)
                </p>
              </div>
              <StatusIcon ok={apiOk} />
            </div>
          </div>

          <div className="mt-10 p-6 bg-slate-50 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-2">Sobre esta página</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Esta página mostra o estado em tempo real dos serviços principais. 
              É actualizada a cada minuto e usa o endpoint público <code className="bg-white px-1.5 py-0.5 rounded text-xs">/api/health</code>.
              Para informação detalhada sobre incidentes ou manutenções planeadas, contacte o suporte.
            </p>
          </div>
        </section>

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}

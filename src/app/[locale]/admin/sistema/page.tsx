import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Database, Users, Briefcase, BookOpen, FileText, AlertCircle, Calendar, Euro, HardDrive, Clock, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface HealthData {
  status: string; db_size_mb: number; active_users_24h: number;
  jobs_pending: number; jobs_failed_24h: number; ai_calls_24h: number; ai_cost_24h_eur: number;
}
interface CronJob { name: string; schedule: string; active: boolean }
interface Overview {
  ok: boolean; error?: string;
  health?: HealthData;
  counts?: { users: number; active_orgs: number; courses: number; pending_proposals: number; pending_applications: number };
  costs?: { ai_cost_7d_eur: number; ai_cost_30d_eur: number };
  storage_used_mb?: number;
  recent_errors_24h?: number;
  cron_jobs?: CronJob[];
  generated_at?: string;
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect(`/${locale}`);
  
  const { data } = await sb.rpc('nl_admin_system_overview');
  const overview = (data as Overview) || { ok: false };
  
  if (!overview.ok) {
    return (
      <div className="">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <p className="text-sm text-rose-900">Erro a carregar overview: {overview.error}</p>
        </div>
      </div>
    );
  }
  
  const { health, counts, costs, cron_jobs, recent_errors_24h, storage_used_mb } = overview;
  const isHealthy = health?.status === 'ok';
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <AdminPageHeader
        backHref="/admin"
        emoji="🖥️"
        title="Sistema"
        description="Saúde da plataforma em tempo real"
        actions={
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isHealthy ? 'Operacional' : 'Degradado'}
          </span>
        }
      />
      
      {/* Health KPIs principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={<Database />} label="DB" value={`${health?.db_size_mb || 0} MB`} color="text-indigo-600" />
        <Stat icon={<HardDrive />} label="Storage" value={`${storage_used_mb || 0} MB`} color="text-purple-600" />
        <Stat icon={<Users />} label="Activos 24h" value={String(health?.active_users_24h ?? 0)} color="text-blue-600" />
        <Stat icon={<Clock />} label="Jobs pending" value={String(health?.jobs_pending ?? 0)} color="text-amber-600"
          warning={Boolean(health?.jobs_pending && health.jobs_pending > 10)} />
      </div>
      
      {/* Counts gerais */}
      <div>
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Plataforma</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat icon={<Users />} label="Users" value={String(counts?.users ?? 0)} color="text-slate-700" />
          <Stat icon={<Briefcase />} label="Empresas" value={String(counts?.active_orgs ?? 0)} color="text-violet-600" />
          <Stat icon={<BookOpen />} label="Cursos" value={String(counts?.courses ?? 0)} color="text-emerald-600" />
          <Stat icon={<FileText />} label="Propostas" value={String(counts?.pending_proposals ?? 0)} color="text-amber-600" />
          <Stat icon={<FileText />} label="Candidatos" value={String(counts?.pending_applications ?? 0)} color="text-rose-600" />
        </div>
      </div>
      
      {/* IA & Costs */}
      <div>
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Custos IA</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Euro />} label="24h" value={`${(health?.ai_cost_24h_eur ?? 0).toFixed(2)}€`} color="text-blue-600" sub={`${health?.ai_calls_24h ?? 0} calls`} />
          <Stat icon={<Euro />} label="7 dias" value={`${(costs?.ai_cost_7d_eur ?? 0).toFixed(2)}€`} color="text-blue-600" />
          <Stat icon={<Euro />} label="30 dias" value={`${(costs?.ai_cost_30d_eur ?? 0).toFixed(2)}€`} color="text-blue-700" />
        </div>
      </div>
      
      {/* Jobs status */}
      {(health?.jobs_failed_24h ?? 0) > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900">{health?.jobs_failed_24h} jobs falharam nas últimas 24h</h3>
              <Link href={`/admin/jobs` as any} className="text-xs text-rose-700 hover:underline">
                Ver jobs →
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {(recent_errors_24h ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">{recent_errors_24h} erros de frontend nas últimas 24h</h3>
              <Link href={`/admin/erros` as any} className="text-xs text-amber-700 hover:underline">
                Ver detalhes →
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Cron jobs */}
      <div>
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" /> Cron jobs activos ({cron_jobs?.length || 0})
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {(cron_jobs || []).map((j) => (
            <div key={j.name} className="flex items-center justify-between py-2.5 px-4">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-mono text-slate-700 truncate">{j.name}</span>
              </div>
              <span className="text-xs font-mono text-slate-400 ml-2 flex-shrink-0">{j.schedule}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-[10px] text-slate-400 text-center pt-2">
        Snapshot: {overview.generated_at ? new Date(overview.generated_at).toLocaleString('pt-PT') : '—'}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color, sub, warning }: { 
  icon: React.ReactNode; label: string; value: string; color: string; sub?: string; warning?: boolean 
}) {
  return (
    <div className={`bg-white rounded-xl border ${warning ? 'border-amber-300' : 'border-slate-200'} p-3 sm:p-4`}>
      <div className={`${color} mb-1.5`}>{icon}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg sm:text-xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

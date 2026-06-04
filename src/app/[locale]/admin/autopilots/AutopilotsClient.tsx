'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { 
  CheckCircle2, XCircle, Clock, Calendar, AlertCircle, 
  Power, RefreshCw, Loader2, Moon, Activity, Euro
} from 'lucide-react';
import { toggleAutopilotAction, hibernateAllAction, listAutopilotsAction } from './actions';

interface AutopilotRow {
  key: string;
  enabled: boolean;
  description: string;
  category: string;
  job_type: string;
  cron_schedule: string | null;
  cron_jobname: string | null;
  last_run: string | null;
  last_run_status: string | null;
  total_runs_30d: number;
  failed_runs_7d: number;
  estimated_cost_eur_month: number;
  updated_at: string | null;
  updated_by: string | null;
}

const FRIENDLY_NAMES: Record<string, string> = {
  autopilot_blog_enabled: 'Blog · gerar posts',
  autopilot_blog_translate_enabled: 'Blog · traduzir 4 línguas',
  autopilot_social_enabled: 'Redes sociais · gerar variantes',
  autopilot_scout_enabled: 'Scout · sugerir tópicos',
  autopilot_seo_audit_enabled: 'SEO · auditar páginas',
  autopilot_kpi_snapshot_enabled: 'KPI · snapshot diário',
  autopilot_compliance_check_enabled: 'Compliance · verificação diária',
  autopilot_social_publish_enabled: 'Redes sociais · publicar agendados',
};

function describeCron(cron: string | null): string {
  if (!cron) return 'Sob demanda';
  const map: Record<string, string> = {
    '*/5 * * * *': 'A cada 5 minutos',
    '*/15 * * * *': 'A cada 15 minutos',
    '0 9 * * *': 'Diário às 09:00 UTC',
    '0 9 * * 1': 'Segundas às 09:00 UTC',
    '30 0 * * *': 'Diário às 00:30 UTC',
    '0 7 * * *': 'Diário às 07:00 UTC',
    '0 17 * * 5': 'Sextas às 17:00 UTC',
  };
  return map[cron] || cron;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'nunca';
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

export function AutopilotsClient({ initial }: { initial: AutopilotRow[] }) {
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [actingOn, setActingOn] = useState<string | null>(null);
  
  const paidEnabled = items.filter((i) => i.enabled && i.estimated_cost_eur_month > 0);
  const totalMonthly = paidEnabled.reduce((s, i) => s + Number(i.estimated_cost_eur_month), 0);
  const allPaidOff = paidEnabled.length === 0;
  
  async function refresh() {
    const r = await listAutopilotsAction();
    if (r.ok && r.data) setItems(r.data);
  }

  function handleToggle(key: string, current: boolean) {
    setActingOn(key);
    startTransition(async () => {
      const r = await toggleAutopilotAction(key, !current);
      if (r.ok) {
        toast.success(!current ? 'Activado' : 'Desactivado');
        await refresh();
      } else {
        toast.error(r.error || 'Falhou');
      }
      setActingOn(null);
    });
  }
  
  function handleHibernateAll() {
    if (!confirm('Desligar TODOS os autopilots pagos? Os gratuitos (KPI, compliance, publicar social) ficam activos.')) return;
    startTransition(async () => {
      const r = await hibernateAllAction();
      if (r.ok) {
        toast.success(`${r.data?.disabled || 0} autopilots desactivados`);
        await refresh();
      } else {
        toast.error(r.error || 'Falhou');
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-600" />
            Autopilots
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tarefas que correm automaticamente em horários definidos. Os cron jobs continuam armados — quando desactivas um autopilot, o cron passa pelo trigger mas não gasta IA.
          </p>
        </div>
        <button type="button" onClick={refresh} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>

      <div className={`rounded-xl border p-4 ${allPaidOff ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {allPaidOff ? (
            <Moon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Euro className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 text-sm">
              {allPaidOff ? 'Hibernação activa' : `${paidEnabled.length} autopilot${paidEnabled.length !== 1 ? 's' : ''} pagos ligados`}
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              {allPaidOff 
                ? 'Tudo o que custa está desligado. Só os 3 autopilots gratuitos correm (KPI, compliance, publicar social agendado).'
                : `Custo IA estimado: ~€${totalMonthly.toFixed(2)}/mês`}
            </div>
          </div>
          {!allPaidOff && (
            <button 
              type="button" 
              onClick={handleHibernateAll} 
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 flex-shrink-0"
            >
              <Moon className="h-3.5 w-3.5" /> Hibernar todos
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <AutopilotCard 
            key={item.key} 
            item={item}
            isPending={isPending && actingOn === item.key}
            onToggle={() => handleToggle(item.key, item.enabled)}
          />
        ))}
      </div>
    </div>
  );
}

function AutopilotCard({ item, isPending, onToggle }: { item: AutopilotRow; isPending: boolean; onToggle: () => void }) {
  const cost = Number(item.estimated_cost_eur_month);
  const isFree = cost === 0;
  const friendlyName = FRIENDLY_NAMES[item.key] || item.key.replace('autopilot_', '').replace(/_/g, ' ');
  
  return (
    <div className={`bg-white rounded-xl border ${item.enabled ? 'border-emerald-200' : 'border-slate-200'} overflow-hidden`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900">{friendlyName}</h3>
              {item.enabled ? (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Ligado
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                  <Power className="h-2.5 w-2.5" /> Desligado
                </span>
              )}
              {isFree ? (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Grátis</span>
              ) : (
                <span className="text-[10px] font-bold tracking-wider bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                  <Euro className="h-2.5 w-2.5" /> ~{cost.toFixed(2)}/mês
                </span>
              )}
              {item.failed_runs_7d > 0 && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" /> {item.failed_runs_7d} falhas 7d
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1.5">{item.description}</p>
            
            <div className="mt-3 flex items-center gap-4 flex-wrap text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {describeCron(item.cron_schedule)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última execução: {formatDate(item.last_run)}
              </span>
              {item.total_runs_30d > 0 && (
                <span>
                  {item.total_runs_30d} execuções (30d)
                </span>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={onToggle}
            disabled={isPending}
            aria-label={item.enabled ? 'Desligar' : 'Ligar'}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 ${
              item.enabled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            {isPending ? (
              <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
            ) : (
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  item.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

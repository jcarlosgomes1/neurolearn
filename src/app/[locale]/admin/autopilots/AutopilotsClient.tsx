'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { 
  CheckCircle2, XCircle, Clock, Calendar, AlertCircle, 
  Power, RefreshCw, Loader2, Moon, Activity, Euro, Edit3, Check, X
} from 'lucide-react';
import { toggleAutopilotAction, hibernateAllAction, listAutopilotsAction, updateScheduleAction } from './actions';

interface AutopilotRow {
  key: string; enabled: boolean; description: string; category: string;
  job_type: string;
  cron_jobid: number | null; cron_schedule: string | null; cron_jobname: string | null; cron_active: boolean | null;
  last_run: string | null; last_run_status: string | null;
  total_runs_30d: number; failed_runs_7d: number;
  estimated_cost_eur_month: number;
  updated_at: string | null; updated_by: string | null;
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

const SCHEDULE_PRESETS: Array<{ label: string; cron: string; help: string }> = [
  { label: 'A cada 5 minutos', cron: '*/5 * * * *', help: 'Várias execuções por hora' },
  { label: 'A cada 15 minutos', cron: '*/15 * * * *', help: 'Recurrente, mais espaçado' },
  { label: 'A cada hora', cron: '0 * * * *', help: 'No minuto 0 de cada hora' },
  { label: 'Diário 00:30 UTC', cron: '30 0 * * *', help: 'Madrugada (snapshots etc)' },
  { label: 'Diário 07:00 UTC', cron: '0 7 * * *', help: 'Manhã cedo' },
  { label: 'Diário 09:00 UTC', cron: '0 9 * * *', help: 'Manhã, ideal para blog' },
  { label: 'Diário 12:00 UTC', cron: '0 12 * * *', help: 'Meio-dia' },
  { label: 'Diário 18:00 UTC', cron: '0 18 * * *', help: 'Final do dia' },
  { label: 'Segundas 09:00 UTC', cron: '0 9 * * 1', help: 'Início da semana' },
  { label: 'Sextas 17:00 UTC', cron: '0 17 * * 5', help: 'Fim da semana' },
  { label: 'Mensal dia 1', cron: '0 9 1 * *', help: 'Primeiro dia do mês' },
];

function describeCron(cron: string | null): string {
  if (!cron) return 'Sob demanda';
  const found = SCHEDULE_PRESETS.find((p) => p.cron === cron);
  if (found) return found.label;
  if (cron === '@daily') return 'Diariamente (default)';
  if (cron === '@weekly') return 'Semanalmente';
  if (cron === '@hourly') return 'A cada hora';
  return cron;
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
      <AdminPageHeader
        emoji="🛸"
        title="Autopilots"
        description="Tarefas que correm automaticamente em horários definidos. Liga/desliga ou ajusta o horário sem ter de mexer em código."
        actions={
          <button type="button" onClick={refresh} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
        }
      />

      <div className={`rounded-xl border p-4 ${allPaidOff ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {allPaidOff ? <Moon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" /> : <Euro className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 text-sm">
              {allPaidOff ? 'Hibernação activa' : `${paidEnabled.length} autopilot${paidEnabled.length !== 1 ? 's' : ''} pagos ligados`}
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              {allPaidOff 
                ? 'Tudo o que custa está desligado. Só os 3 autopilots gratuitos correm.'
                : `Custo IA estimado: ~€${totalMonthly.toFixed(2)}/mês`}
            </div>
          </div>
          {!allPaidOff && (
            <button type="button" onClick={handleHibernateAll} disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 flex-shrink-0">
              <Moon className="h-3.5 w-3.5" /> Hibernar todos
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <AutopilotCard 
            key={item.key} item={item}
            isPending={isPending && actingOn === item.key}
            onToggle={() => handleToggle(item.key, item.enabled)}
            onScheduleSaved={refresh}
          />
        ))}
      </div>
    </div>
  );
}

function AutopilotCard({ item, isPending, onToggle, onScheduleSaved }: { item: AutopilotRow; isPending: boolean; onToggle: () => void; onScheduleSaved: () => Promise<void> }) {
  const [editingSchedule, setEditingSchedule] = useState(false);
  const cost = Number(item.estimated_cost_eur_month);
  const isFree = cost === 0;
  const friendlyName = FRIENDLY_NAMES[item.key] || item.key.replace('autopilot_', '').replace(/_/g, ' ');
  const hasCron = !!item.cron_jobid && !!item.cron_schedule;
  
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
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span className="font-medium text-slate-700">{describeCron(item.cron_schedule)}</span>
                {hasCron && (
                  <button type="button" onClick={() => setEditingSchedule(!editingSchedule)} className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5 hover:underline">
                    <Edit3 className="h-3 w-3" /> editar
                  </button>
                )}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última: {formatDate(item.last_run)}
              </span>
              {item.total_runs_30d > 0 && <span>{item.total_runs_30d} execuções 30d</span>}
            </div>
          </div>
          
          <button type="button" onClick={onToggle} disabled={isPending} aria-label={item.enabled ? 'Desligar' : 'Ligar'}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 ${
              item.enabled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}>
            {isPending ? (
              <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
            ) : (
              <span aria-hidden="true"
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  item.enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
            )}
          </button>
        </div>

        {editingSchedule && hasCron && (
          <ScheduleEditor 
            jobid={item.cron_jobid!}
            currentCron={item.cron_schedule!}
            onSaved={async () => { setEditingSchedule(false); await onScheduleSaved(); }}
            onCancel={() => setEditingSchedule(false)}
          />
        )}
      </div>
    </div>
  );
}

function ScheduleEditor({ jobid, currentCron, onSaved, onCancel }: { jobid: number; currentCron: string; onSaved: () => Promise<void>; onCancel: () => void }) {
  const [selected, setSelected] = useState(currentCron);
  const [customCron, setCustomCron] = useState(SCHEDULE_PRESETS.find((p) => p.cron === currentCron) ? '' : currentCron);
  const [useCustom, setUseCustom] = useState(!SCHEDULE_PRESETS.find((p) => p.cron === currentCron));
  const [isPending, startTransition] = useTransition();
  
  function handleSave() {
    const cronToUse = useCustom ? customCron.trim() : selected;
    if (!cronToUse) {
      toast.error('Indica um schedule válido');
      return;
    }
    if (cronToUse === currentCron) {
      toast.info('Sem alterações');
      onCancel();
      return;
    }
    startTransition(async () => {
      const r = await updateScheduleAction(jobid, cronToUse);
      if (r.ok) {
        toast.success(`Horário actualizado: ${cronToUse}`);
        await onSaved();
      } else {
        toast.error(r.error || 'Falhou actualizar');
      }
    });
  }
  
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Editar horário</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap text-xs">
          <button type="button" onClick={() => setUseCustom(false)}
            className={`px-2.5 py-1 rounded ${!useCustom ? 'bg-brand-100 text-brand-700 font-semibold' : 'bg-slate-100 text-slate-600'}`}>
            Presets
          </button>
          <button type="button" onClick={() => setUseCustom(true)}
            className={`px-2.5 py-1 rounded ${useCustom ? 'bg-brand-100 text-brand-700 font-semibold' : 'bg-slate-100 text-slate-600'}`}>
            Custom cron
          </button>
        </div>
        
        {!useCustom ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
            {SCHEDULE_PRESETS.map((p) => (
              <button key={p.cron} type="button" onClick={() => setSelected(p.cron)}
                className={`text-left p-2 rounded border text-xs transition-colors ${
                  selected === p.cron 
                    ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}>
                <div className="font-semibold text-slate-900">{p.label}</div>
                <div className="text-slate-500 mt-0.5">{p.help}</div>
                <code className="text-[10px] text-slate-400 mt-1 block">{p.cron}</code>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <input type="text" value={customCron} onChange={(e) => setCustomCron(e.target.value)}
              placeholder="ex: 0 9 * * * (m h dom mon dow)"
              className="w-full font-mono text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
            <div className="text-xs text-slate-500">
              Formato: <code className="bg-slate-100 px-1 rounded">m h dom mon dow</code> (UTC).
              Exemplos: <code className="bg-slate-100 px-1 rounded">0 9 * * *</code> (diário 9h),{' '}
              <code className="bg-slate-100 px-1 rounded">*/30 * * * *</code> (a cada 30 min).
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handleSave} disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Guardar horário
        </button>
        <button type="button" onClick={onCancel} disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm">
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
      </div>
    </div>
  );
}

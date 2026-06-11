'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Clock, Globe, RefreshCw, Loader2, Bug, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { listErrorsAction } from './actions';

interface ErrorRow {
  id: number;
  event: string;
  context: string;
  data: { message?: string; stack?: string; digest?: string; url?: string; user_agent?: string };
  user_agent: string | null;
  created_at: string;
}

interface ErrorSummary {
  error_message: string;
  context: string;
  occurrences: number;
  first_seen: string;
  last_seen: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function ErrorsClient({ initialList, initialSummary }: { initialList: ErrorRow[]; initialSummary: ErrorSummary[] }) {
  const [list, setList] = useState(initialList);
  const [summary, setSummary] = useState(initialSummary);
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [sinceHours, setSinceHours] = useState(168);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<number | null>(null);
  
  function refresh(hours: number) {
    setSinceHours(hours);
    startTransition(async () => {
      const r = await listErrorsAction(hours);
      if (r.ok && r.data) {
        setList(r.data.list);
        setSummary(r.data.summary);
      } else {
        toast.error(r.error || 'Falhou');
      }
    });
  }

  const totalErrors = list.length;
  const uniqueMessages = summary.length;
  const last24h = list.filter((e) => Date.now() - new Date(e.created_at).getTime() < 86400000).length;
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <AdminPageHeader
        backHref="/admin"
        emoji="🐛"
        title="Erros do cliente"
        description="Erros JavaScript capturados pelos ErrorBoundaries da app. Logados automaticamente sem necessitar de Sentry."
        actions={
          <button type="button" onClick={() => refresh(sinceHours)} disabled={isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total" value={totalErrors} icon={<AlertCircle className="h-4 w-4" />} colour="text-slate-700" />
        <Stat label="Únicos" value={uniqueMessages} icon={<TrendingUp className="h-4 w-4" />} colour="text-indigo-700" />
        <Stat label="Últimas 24h" value={last24h} icon={<Clock className="h-4 w-4" />} colour={last24h > 0 ? 'text-rose-700' : 'text-emerald-700'} />
        <Stat label="Janela" value={`${sinceHours}h`} icon={<Globe className="h-4 w-4" />} colour="text-slate-700" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex bg-slate-100 rounded-md p-0.5 text-xs font-medium">
          <button onClick={() => setView('summary')} className={`px-3 py-1.5 rounded ${view === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            Agregado por mensagem
          </button>
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            Lista cronológica
          </button>
        </div>
        <div className="flex bg-slate-100 rounded-md p-0.5 text-xs font-medium ml-auto">
          {[24, 72, 168, 720].map((h) => (
            <button key={h} onClick={() => refresh(h)} disabled={isPending}
              className={`px-2.5 py-1.5 rounded ${sinceHours === h ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {h < 168 ? `${h}h` : h === 168 ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </div>

      {totalErrors === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-12 text-center">
          <div className="text-5xl mb-3">✨</div>
          <h3 className="font-bold text-emerald-900">Sem erros nas últimas {sinceHours < 168 ? `${sinceHours}h` : sinceHours === 168 ? '7 dias' : '30 dias'}</h3>
          <p className="text-sm text-emerald-700 mt-1">A app está estável.</p>
        </div>
      ) : view === 'summary' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Mensagem</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Contexto</th>
                <th className="text-right px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Ocorrências</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Última</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-900 font-mono text-xs break-words max-w-md">{s.error_message}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{s.context}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`inline-flex font-semibold px-2 py-0.5 rounded ${s.occurrences > 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                      {s.occurrences}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500" title={formatDate(s.last_seen)}>{timeAgo(s.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="w-full p-4 text-left flex items-start gap-3 hover:bg-slate-50">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-slate-900 break-words">{e.data?.message || e.event}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span>{e.context}</span>
                    <span>·</span>
                    <span title={formatDate(e.created_at)}>{timeAgo(e.created_at)}</span>
                    {e.data?.url && <><span>·</span><span className="truncate max-w-xs">{e.data.url}</span></>}
                  </div>
                </div>
                {expanded === e.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {expanded === e.id && (
                <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50">
                  {e.data?.stack && (
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Stack trace</div>
                      <pre className="text-[11px] font-mono bg-white p-3 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap">{e.data.stack}</pre>
                    </div>
                  )}
                  {e.data?.digest && (
                    <div className="text-xs"><span className="text-slate-500">Digest:</span> <code className="text-slate-700">{e.data.digest}</code></div>
                  )}
                  {(e.data?.user_agent || e.user_agent) && (
                    <div className="text-xs text-slate-500 break-words"><span className="font-semibold">User agent:</span> {e.data?.user_agent || e.user_agent}</div>
                  )}
                  <div className="text-xs text-slate-400">Registado: {formatDate(e.created_at)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, colour }: { label: string; value: number | string; icon: React.ReactNode; colour: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className={`flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold ${colour}`}>{icon}{label}</div>
      <div className={`mt-1 text-xl font-bold ${colour}`}>{value}</div>
    </div>
  );
}

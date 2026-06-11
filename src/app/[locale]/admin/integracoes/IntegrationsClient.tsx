'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useMemo, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { 
  CheckCircle2, XCircle, AlertCircle, ExternalLink, Eye, EyeOff, 
  Save, Trash2, PlayCircle, Loader2, ChevronDown, ChevronUp, Clock, Shield
} from 'lucide-react';
import { saveSecretAction, pushOAuthProviderAction, refreshIntegrationsAction } from './actions';

interface Integration {
  key: string;
  display_name: string;
  category: string;
  description: string | null;
  provider_url: string | null;
  instructions: string | null;
  is_required: boolean;
  has_test: boolean;
  apply_strategy: string | null;
  auth_provider_key: string | null;
  affects_features: string[] | null;
  configured: boolean;
  value_masked: string | null;
  last_tested_at: string | null;
  last_test_status: string | null;
  last_test_message: string | null;
  updated_at: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  'IA': '🧠', 'Email': '✉️', 'Vídeo': '🎥', 'Pagamentos': '💳',
  'Imagens': '🖼', 'OAuth': '🔐', 'Config': '⚙️', 'Interno': '🔧',
};
const KNOWN_ORDER = ['IA', 'Email', 'Vídeo', 'Pagamentos', 'Imagens', 'OAuth', 'Config', 'Interno'];

export function IntegrationsClient({ initial }: { initial: Integration[] }) {
  const t = useTranslations();
  const [data, setData] = useState<Integration[]>(initial);

  const grouped = useMemo(() => {
    const groups: Record<string, Integration[]> = {};
    for (const i of data) {
      if (!groups[i.category]) groups[i.category] = [];
      groups[i.category].push(i);
    }
    const seen = new Set(KNOWN_ORDER);
    const extras = Object.keys(groups).filter((c) => !seen.has(c)).sort();
    const order = [...KNOWN_ORDER, ...extras];
    return order.map((cat) => ({ category: cat, items: groups[cat] || [] })).filter((g) => g.items.length > 0);
  }, [data]);

  const requiredMissing = data.filter((i) => i.is_required && !i.configured).length;
  const requiredOk = data.filter((i) => i.is_required && i.configured).length;
  const requiredTotal = data.filter((i) => i.is_required).length;

  async function refresh() {
    const fresh = await refreshIntegrationsAction();
    setData(fresh as Integration[]);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <AdminPageHeader backHref="/admin" emoji="🔌" title={t('integrations.title')} description={t('integrations.subtitle')} />
      <p className="text-xs text-slate-400 mt-2">
        🔐 Chaves OAuth (Google/GitHub/Microsoft) são automaticamente activadas no Supabase Auth quando guardadas — desde que <code className="bg-slate-100 px-1 rounded">SUPABASE_MANAGEMENT_TOKEN</code> esteja configurado.
      </p>

      <div className={`rounded-xl border p-4 ${requiredMissing > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex items-start gap-3">
          {requiredMissing > 0 ? (
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 text-sm">
              {requiredOk}/{requiredTotal} integrações essenciais configuradas
            </div>
            {requiredMissing > 0 && (
              <div className="text-xs text-amber-700 mt-1">
                Faltam {requiredMissing} essencial(is)
              </div>
            )}
          </div>
        </div>
      </div>

      {grouped.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 px-1">
            <span>{CATEGORY_ICONS[group.category] || '•'}</span>
            {group.category}
          </h2>
          <div className="space-y-3">
            {group.items.map((item) => (
              <IntegrationCard key={item.key} item={item} onUpdate={refresh} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function IntegrationCard({ item, onUpdate }: { item: Integration; onUpdate: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [showInstructions, setShowInstructions] = useState(!item.configured);
  const [isPending, startTransition] = useTransition();
  const [lastError, setLastError] = useState<string | null>(null);

  const isOAuthKey = item.apply_strategy?.startsWith('supabase_auth_');
  const status = !item.configured ? 'missing' : item.last_test_status || 'untested';

  function handleSave() {
    setLastError(null);
    if (!value.trim()) {
      setLastError('Cola o valor antes de guardar.');
      return;
    }
    
    startTransition(async () => {
      try {
        const result = await saveSecretAction(item.key, value.trim());
        
        if (!result.ok) {
          setLastError(result.error || 'Falhou');
          toast.error(result.error || 'Falhou');
          return;
        }
        
        // Push OAuth ao Supabase Auth se aplicável
        if (isOAuthKey && item.auth_provider_key) {
          const field: 'client_id' | 'secret' = item.apply_strategy === 'supabase_auth_secret' ? 'secret' : 'client_id';
          const pushResult = await pushOAuthProviderAction(item.auth_provider_key as 'google'|'github'|'azure', field, value.trim());
          if (pushResult.ok) {
            toast.success('Guardado e activado no Supabase Auth');
          } else {
            toast.warning(`Guardado, mas push ao Supabase falhou: ${pushResult.error}`);
          }
        } else {
          toast.success(result.data?.action === 'deleted' ? 'Removido' : 'Guardado');
        }
        
        setValue('');
        setEditing(false);
        await onUpdate();
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        setLastError(err);
        toast.error(err);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Remover ${item.display_name}?`)) return;
    startTransition(async () => {
      const result = await saveSecretAction(item.key, '');
      if (result.ok) {
        toast.success('Removido');
        await onUpdate();
      } else {
        toast.error(result.error || 'Falhou');
        setLastError(result.error || null);
      }
    });
  }

  return (
    <div className={`bg-white rounded-xl border ${item.is_required && !item.configured ? 'border-amber-200' : 'border-slate-200'} overflow-hidden`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900">{item.display_name}</h3>
              {item.is_required && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  Essencial
                </span>
              )}
              {isOAuthKey && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" /> Supabase Auth
                </span>
              )}
              <StatusBadge status={status} message={item.last_test_message} />
            </div>
            {item.description && <p className="text-sm text-slate-600 mt-1">{item.description}</p>}
            {item.affects_features && item.affects_features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.affects_features.map((f) => (
                  <span key={f} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{f}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {item.configured && !editing && (
          <div className="mt-4 flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500">Valor actual</div>
              <code className="text-sm text-slate-700 font-mono">{item.value_masked}</code>
              {item.last_tested_at && (
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Último teste: {new Date(item.last_tested_at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button type="button" onClick={() => setEditing(true)} className="text-xs px-2.5 py-1.5 rounded-md hover:bg-white text-slate-700">Editar</button>
              <button type="button" onClick={handleDelete} disabled={isPending} className="text-xs px-2 py-1.5 rounded-md hover:bg-red-50 text-red-600">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {(editing || !item.configured) && (
          <div className="mt-4 space-y-2">
            <div className="relative">
              <input
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Cola aqui o valor de ${item.display_name}...`}
                className="input pr-10 font-mono text-sm"
                autoComplete="off"
                disabled={isPending}
              />
              <button type="button" onClick={() => setShowValue(!showValue)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {isPending ? 'A guardar…' : 'Guardar'}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(false); setValue(''); setLastError(null); }} disabled={isPending} className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700">
                  Cancelar
                </button>
              )}
            </div>
            
            {lastError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 break-words">
                <strong>Erro:</strong> {lastError}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {item.provider_url && (
            <a href={item.provider_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium">
              <ExternalLink className="h-3 w-3" /> Obter key
            </a>
          )}
          {item.instructions && (
            <button type="button" onClick={() => setShowInstructions(!showInstructions)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-50 text-slate-500 text-xs">
              {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Instruções
            </button>
          )}
        </div>

        {showInstructions && item.instructions && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{item.instructions}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, message }: { status: string; message: string | null }) {
  if (status === 'ok') return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded" title={message || ''}>
      <CheckCircle2 className="h-3 w-3" /> OK
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded" title={message || ''}>
      <XCircle className="h-3 w-3" /> Falha
    </span>
  );
  if (status === 'missing') return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
      Não configurada
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
      Por testar
    </span>
  );
}

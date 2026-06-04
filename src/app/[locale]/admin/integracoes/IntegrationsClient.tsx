'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { toast } from 'sonner';
import { 
  CheckCircle2, XCircle, AlertCircle, ExternalLink, Eye, EyeOff, 
  Save, Trash2, PlayCircle, Loader2, ChevronDown, ChevronUp, Clock, Shield, Bug
} from 'lucide-react';

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

// Telemetria — regista cada passo do save no servidor para diagnóstico
async function telemetry(event: string, context: string, data: unknown) {
  try {
    const sb = createClient();
    await sb.rpc('nl_telemetry_log', { p_event: event, p_context: context, p_data: data as any });
  } catch { /* nunca falhar por causa de telemetria */ }
}

// Save com fetch nativo (contorna possíveis bugs no supabase-js)
async function saveSecretNative(key: string, value: string, accessToken: string, anonKey: string): Promise<{ ok: boolean; data?: any; error?: string; status?: number }> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/rpc/nl_admin_integrations_set`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ p_key: key, p_value: value }),
    });
    const text = await resp.text();
    let data: any;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!resp.ok) {
      return { ok: false, status: resp.status, error: data?.message || data?.error || text || `HTTP ${resp.status}`, data };
    }
    return { ok: !!data?.ok, data, status: resp.status, error: data?.ok ? undefined : (data?.error || 'rpc_returned_not_ok') };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function pushOAuthToSupabase(item: Integration, value: string, accessToken: string) {
  if (!item.auth_provider_key) return null;
  const provider = item.auth_provider_key;
  const isSecret = item.apply_strategy === 'supabase_auth_secret';
  const body: Record<string, unknown> = {
    [`external_${provider}_enabled`]: true,
    [`external_${provider}_${isSecret ? 'secret' : 'client_id'}`]: value,
  };
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok && data?.ok, data, status: resp.status };
}

export function IntegrationsClient({ initial }: { initial: Integration[] }) {
  const t = useTranslations();
  const [data, setData] = useState<Integration[]>(initial);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Captura erros JS globais
  useEffect(() => {
    function onError(e: ErrorEvent) {
      telemetry('window_error', '/admin/integracoes', { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno });
    }
    function onUnhandled(e: PromiseRejectionEvent) {
      telemetry('unhandled_rejection', '/admin/integracoes', { reason: String(e.reason).slice(0, 500) });
    }
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    telemetry('page_loaded', '/admin/integracoes', { ua: navigator.userAgent.slice(0, 200), items: initial.length });
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, [initial.length]);

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
    const sb = createClient();
    const { data: fresh } = await sb.rpc('nl_admin_integrations_list');
    if (fresh) setData(fresh as Integration[]);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('integrations.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('integrations.subtitle')}</p>
        <p className="text-xs text-slate-400 mt-2">
          🔐 Chaves OAuth (Google/GitHub/Microsoft) são automaticamente activadas no Supabase Auth quando guardadas — desde que <code className="bg-slate-100 px-1 rounded">SUPABASE_MANAGEMENT_TOKEN</code> esteja configurado.
        </p>
        <button onClick={() => setShowDiagnostics(!showDiagnostics)} className="mt-2 text-[11px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
          <Bug className="h-3 w-3" /> {showDiagnostics ? 'Esconder' : 'Mostrar'} diagnóstico
        </button>
      </div>

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
              <IntegrationCard key={item.key} item={item} onUpdate={refresh} showDiagnostics={showDiagnostics} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function IntegrationCard({ item, onUpdate, showDiagnostics }: { item: Integration; onUpdate: () => Promise<void>; showDiagnostics: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [showInstructions, setShowInstructions] = useState(!item.configured);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastDiagnostic, setLastDiagnostic] = useState<string | null>(null);

  const isOAuthKey = item.apply_strategy?.startsWith('supabase_auth_');
  const status = !item.configured ? 'missing' : item.last_test_status || 'untested';

  async function save() {
    setLastError(null);
    setLastDiagnostic('A iniciar save...');
    if (saving) { setLastDiagnostic('Já a guardar — ignorar duplo clique'); return; }
    if (!value.trim()) { setLastError('Valor vazio. Cola o token antes de guardar.'); return; }
    setSaving(true);
    
    await telemetry('save_clicked', item.key, { value_length: value.length, is_oauth: isOAuthKey });

    try {
      // Obter session token
      const sb = createClient();
      const sessionResult = await sb.auth.getSession();
      const session = sessionResult.data.session;
      
      if (!session) {
        const err = 'Sessão expirada. Faz logout e login novamente.';
        setLastError(err);
        await telemetry('save_no_session', item.key, { error: 'no_session' });
        toast.error(err);
        return;
      }

      setLastDiagnostic(`Sessão OK (${session.user.email}). A chamar Supabase...`);
      
      // Pegar anon key do client (usado para apikey header)
      const anonKey = (sb as any)?.supabaseKey || (sb as any)?.rest?.headers?.apikey || '';
      
      const result = await saveSecretNative(item.key, value.trim(), session.access_token, anonKey);
      
      await telemetry('save_result', item.key, { 
        ok: result.ok, 
        status: result.status, 
        error: result.error,
        data: result.data 
      });

      if (!result.ok) {
        const err = `Falha (HTTP ${result.status || '?'}): ${result.error || 'sem detalhe'}`;
        setLastError(err);
        setLastDiagnostic(`Resposta: ${JSON.stringify(result.data || {}).slice(0, 200)}`);
        toast.error(err);
        return;
      }

      setLastDiagnostic(`✅ Guardado (action=${result.data?.action})`);

      // Push automático ao Supabase Auth se for OAuth
      if (isOAuthKey && value.trim()) {
        setLastDiagnostic(`Guardado. A activar no Supabase Auth...`);
        const pushResult = await pushOAuthToSupabase(item, value.trim(), session.access_token);
        await telemetry('oauth_push_result', item.key, { ok: pushResult?.ok, status: pushResult?.status, data: pushResult?.data });
        if (pushResult?.ok) {
          toast.success('Guardado e activado no Supabase Auth');
          setLastDiagnostic(`✅ Tudo OK — activado no Supabase Auth`);
        } else {
          const msg = pushResult?.data?.error || pushResult?.data?.message || 'sem detalhe';
          toast.warning(`Guardado, mas push ao Supabase falhou: ${msg}`);
          setLastDiagnostic(`⚠️ Guardado mas Supabase Auth não activou: ${msg}`);
        }
      } else {
        toast.success('Guardado');
      }

      setValue('');
      setEditing(false);
      await onUpdate();
    } catch (e) {
      const err = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      setLastError(err);
      setLastDiagnostic(`Exceção: ${err}`);
      await telemetry('save_exception', item.key, { error: err, stack: e instanceof Error ? e.stack?.slice(0, 500) : null });
      toast.error('Erro inesperado: ' + err);
    } finally { 
      setSaving(false); 
    }
  }

  async function deleteValue() {
    if (!confirm(`Remover ${item.display_name}?`)) return;
    setSaving(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { toast.error('Sessão expirada'); return; }
      const anonKey = (sb as any)?.supabaseKey || '';
      const result = await saveSecretNative(item.key, '', session.access_token, anonKey);
      if (result.ok) {
        toast.success('Removido');
        await onUpdate();
      } else {
        toast.error(`Falha: ${result.error}`);
      }
    } finally { setSaving(false); }
  }

  async function test() {
    if (testing) return;
    setTesting(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { toast.error('Sessão expirada'); return; }
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-integrations-test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: item.key }),
      });
      const result = await resp.json();
      if (result.ok) toast.success(result.message || 'Teste OK');
      else toast.error(result.message || result.error || 'Teste falhou');
      await onUpdate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro de rede');
    } finally { setTesting(false); }
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
              <button type="button" onClick={deleteValue} disabled={saving} className="text-xs px-2 py-1.5 rounded-md hover:bg-red-50 text-red-600">
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
              />
              <button type="button" onClick={() => setShowValue(!showValue)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? 'A guardar…' : 'Guardar'}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(false); setValue(''); setLastError(null); setLastDiagnostic(null); }} className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700">
                  Cancelar
                </button>
              )}
            </div>
            
            {/* Erro inline (não dependente de toast) */}
            {lastError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 break-words">
                <strong>Erro:</strong> {lastError}
              </div>
            )}
            
            {/* Diagnóstico inline visível se modo diagnóstico ON ou se houver erro */}
            {(showDiagnostics || lastError) && lastDiagnostic && (
              <div className="mt-2 p-2 bg-slate-100 rounded text-[11px] text-slate-600 font-mono break-words">
                {lastDiagnostic}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {item.has_test && item.configured && (
            <button type="button" onClick={test} disabled={testing} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold disabled:opacity-50">
              {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
              {testing ? 'A testar…' : 'Testar'}
            </button>
          )}
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

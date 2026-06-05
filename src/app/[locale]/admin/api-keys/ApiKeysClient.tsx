'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Key, Plus, Trash2, Copy, Check, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonList } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

const SCOPES = ['read', 'write', 'admin'];

export function ApiKeysClient() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState<string[]>(['read']);
  const [newExpiry, setNewExpiry] = useState('');
  const [created, setCreated] = useState<{ key: string; prefix: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [_, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_api_keys_list');
      if (!error && Array.isArray(data)) setKeys(data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) { toast.error('Nome obrigatório'); return; }
    setCreating(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_api_key_create', {
        p_name: newName.trim(),
        p_scopes: newScopes,
        p_expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
      });
      if (error) throw error;
      const r = data as any;
      setCreated({ key: r.key, prefix: r.prefix });
      setNewName(''); setNewScopes(['read']); setNewExpiry('');
      setShowCreate(false);
      startTransition(load);
    } catch (e: any) {
      toast.error(e?.message || 'Erro a criar chave');
    } finally { setCreating(false); }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revogar esta chave? A acção não pode ser desfeita.')) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_api_key_revoke', { p_id: id });
      toast.success('Chave revogada');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao revogar');
    }
  }

  function copyKey() {
    if (!created) return;
    navigator.clipboard.writeText(created.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleScope(s: string) {
    setNewScopes((arr) => arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">
          <Plus className="h-4 w-4" /> Nova chave
        </button>
      </div>

      {loading ? <SkeletonList rows={3} /> : keys.length === 0 ? (
        <EmptyState icon={<Key className="h-6 w-6" />} title="Sem chaves"
          description="Cria a primeira chave para integrar com sistemas externos."
          cta={{ label: 'Criar chave', onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2.5 text-left">Nome</th>
                <th className="px-3 py-2.5 text-left">Prefixo</th>
                <th className="px-3 py-2.5 text-left">Scopes</th>
                <th className="px-3 py-2.5 text-left">Estado</th>
                <th className="px-3 py-2.5 text-left">Último uso</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const revoked = !!k.revoked_at;
                const expired = k.expires_at && new Date(k.expires_at) < new Date();
                return (
                  <tr key={k.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{k.name}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{k.key_prefix}...</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(k.scopes || []).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {revoked ? <span className="text-rose-600 text-xs">revogada</span> :
                       expired ? <span className="text-amber-600 text-xs">expirada</span> :
                       <span className="text-emerald-600 text-xs">activa</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('pt-PT') : '—'}</td>
                    <td className="px-3 py-2.5 text-right">
                      {!revoked && (
                        <button onClick={() => handleRevoke(k.id)}
                          className="text-rose-600 hover:bg-rose-50 p-1 rounded" aria-label="Revogar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal create */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Nova API Key</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Nome</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: integração CRM"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </label>
              <div>
                <span className="text-xs font-semibold text-slate-700">Scopes</span>
                <div className="flex gap-2 mt-1">
                  {SCOPES.map((s) => (
                    <button key={s} onClick={() => toggleScope(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${newScopes.includes(s) ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Expira em (opcional)</span>
                <input type="datetime-local" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </label>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={handleCreate} disabled={creating}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                {creating ? 'A criar...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal mostrar key recém criada */}
      {created && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Guarda esta chave agora</h3>
                <p className="text-xs text-slate-500">Não será possível voltar a vê-la.</p>
              </div>
            </div>
            <div className="bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded-lg break-all mt-3">
              {created.key}
            </div>
            <div className="mt-3 flex gap-2 justify-end">
              <button onClick={copyKey}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium">
                {copied ? <><Check className="h-4 w-4 text-emerald-600" /> Copiada</> : <><Copy className="h-4 w-4" /> Copiar</>}
              </button>
              <button onClick={() => setCreated(null)}
                className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">
                Guardei
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

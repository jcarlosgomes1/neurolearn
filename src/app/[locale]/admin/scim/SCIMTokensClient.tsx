'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Plus, Trash2, Copy, Check, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonList } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export function SCIMTokensClient() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrg, setNewOrg] = useState('');
  const [newName, setNewName] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [created, setCreated] = useState<{ token: string; prefix: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [_, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const sb = createClient();
      const [tokensRes, orgsRes] = await Promise.all([
        sb.rpc('nl_admin_scim_tokens_list'),
        sb.from('nl_organizations').select('id, name').order('name'),
      ]);
      if (Array.isArray(tokensRes.data)) setTokens(tokensRes.data);
      if (Array.isArray(orgsRes.data)) setOrgs(orgsRes.data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newOrg) { toast.error('Organização obrigatória'); return; }
    if (!newName.trim()) { toast.error('Nome obrigatório'); return; }
    setCreating(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_scim_token_create', {
        p_org_id: newOrg,
        p_name: newName.trim(),
        p_expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
      });
      if (error) throw error;
      const r = data as any;
      setCreated({ token: r.token, prefix: r.prefix });
      setNewOrg(''); setNewName(''); setNewExpiry('');
      setShowCreate(false);
      startTransition(load);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setCreating(false); }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revogar este token SCIM?')) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_scim_token_revoke', { p_id: id });
      toast.success('Token revogado');
      load();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }

  function copyToken() {
    if (!created) return;
    navigator.clipboard.writeText(created.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">
          <Plus className="h-4 w-4" /> Novo token
        </button>
      </div>

      {loading ? <SkeletonList rows={3} /> : tokens.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Sem tokens SCIM"
          description="Os tokens SCIM permitem que sistemas externos provisionem utilizadores automaticamente."
          cta={{ label: 'Criar token', onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2.5 text-left">Org</th>
                <th className="px-3 py-2.5 text-left">Nome</th>
                <th className="px-3 py-2.5 text-left">Prefixo</th>
                <th className="px-3 py-2.5 text-left">Estado</th>
                <th className="px-3 py-2.5 text-left">Último uso</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => {
                const expired = t.expires_at && new Date(t.expires_at) < new Date();
                return (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 text-slate-700 truncate max-w-[200px]">{t.org_name}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{t.name}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{t.token_prefix}...</td>
                    <td className="px-3 py-2.5">
                      {!t.enabled ? <span className="text-rose-600 text-xs">revogado</span> :
                       expired ? <span className="text-amber-600 text-xs">expirado</span> :
                       <span className="text-emerald-600 text-xs">activo</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{t.last_used_at ? new Date(t.last_used_at).toLocaleDateString('pt-PT') : '—'}</td>
                    <td className="px-3 py-2.5 text-right">
                      {t.enabled && (
                        <button onClick={() => handleRevoke(t.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded">
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

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Novo token SCIM</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Organização</span>
                <select value={newOrg} onChange={(e) => setNewOrg(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400">
                  <option value="">Escolher...</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Nome</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: provisioning Okta"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </label>
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

      {created && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Guarda este token agora</h3>
                <p className="text-xs text-slate-500">Não será possível voltar a vê-lo.</p>
              </div>
            </div>
            <div className="bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded-lg break-all mt-3">{created.token}</div>
            <div className="mt-3 flex gap-2 justify-end">
              <button onClick={copyToken}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium">
                {copied ? <><Check className="h-4 w-4 text-emerald-600" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
              </button>
              <button onClick={() => setCreated(null)}
                className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">Guardei</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

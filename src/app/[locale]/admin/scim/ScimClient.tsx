'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Plus, KeyRound, Trash2, X, Building2, Copy, Check, Clock, ShieldOff } from 'lucide-react';

export function ScimClient({ tokens, orgs }: { tokens: any[]; orgs: any[] }) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newToken, setNewToken] = useState<{ token: string; prefix: string } | null>(null);
  const router = useRouter();

  async function create(form: any) {
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_scim_token_create', {
        p_org_id: form.org_id,
        p_name: form.name,
        p_expires_at: form.expires_at || null,
      });
      if (error) throw error;
      setNewToken({ token: data.token, prefix: data.prefix });
      setCreating(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar token');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm('Revogar este token? Os requests SCIM em curso falharão imediatamente.')) return;
    setBusy(true);
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_scim_token_revoke', { p_id: id });
      toast.success('Token revogado');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setBusy(false);
    }
  }

  const active = tokens.filter((t) => t.enabled !== false);
  const revoked = tokens.filter((t) => t.enabled === false);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm text-slate-900">
              {active.length} {active.length === 1 ? 'token ativo' : 'tokens ativos'}
              {revoked.length > 0 && <span className="text-slate-400 font-normal ml-2">· {revoked.length} revogados</span>}
            </h2>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm">
            <Plus className="h-4 w-4" /> Criar token
          </button>
        </div>

        {tokens.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
              <KeyRound className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Sem tokens SCIM</h3>
            <p className="text-sm text-slate-500">Cria um token para começar a sincronizar utilizadores.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tokens.map((t) => (
              <div key={t.id} className={`p-4 flex items-center gap-4 ${t.enabled === false ? 'opacity-60' : ''}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.enabled !== false ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                  {t.enabled !== false ? <KeyRound className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900">{t.name}</span>
                    {t.enabled === false && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">Revogado</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <Building2 className="h-3 w-3" />
                    <span>{t.org_name || '—'}</span>
                    <span>·</span>
                    <span className="font-mono">{t.token_prefix}…</span>
                    {t.last_used_at && (
                      <>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        <span>Último uso: {new Date(t.last_used_at).toLocaleDateString('pt-PT')}</span>
                      </>
                    )}
                  </div>
                </div>
                {t.enabled !== false && (
                  <button onClick={() => revoke(t.id)} disabled={busy} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-rose-600 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <CreateTokenModal orgs={orgs} busy={busy} onCreate={create} onClose={() => setCreating(false)} />
      )}
      {newToken && <TokenRevealModal token={newToken.token} prefix={newToken.prefix} onClose={() => setNewToken(null)} />}
    </>
  );
}

function CreateTokenModal({ orgs, busy, onCreate, onClose }: any) {
  const [form, setForm] = useState({ name: '', org_id: orgs[0]?.id || '', expires_at: '' });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Criar token SCIM</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Nome descritivo</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Okta production"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Organização</label>
            <select
              value={form.org_id}
              onChange={(e) => setForm({ ...form, org_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none">
              {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Data de expiração <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" />
          </div>
        </div>
        <div className="border-t border-slate-100 p-4 flex items-center justify-end gap-2 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-white rounded-lg font-medium">Cancelar</button>
          <button
            onClick={() => onCreate(form)}
            disabled={busy || !form.name || !form.org_id}
            className="px-5 py-2 bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {busy ? 'A criar…' : 'Criar token'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TokenRevealModal({ token, prefix, onClose }: { token: string; prefix: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('Token copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Falhou copiar');
    }
  }
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-4 text-white">
          <h2 className="font-bold text-base">⚠️ Guarda este token agora</h2>
          <p className="text-amber-50 text-xs mt-0.5">É a única vez que será mostrado. Não poderá ser recuperado depois.</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 break-all relative">
            {token}
            <button onClick={copy} className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="text-xs text-slate-500">
            Prefix: <span className="font-mono">{prefix}</span>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold">
            Já guardei — fechar
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonList } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface SSOForm {
  id?: string;
  org_id: string;
  protocol: 'saml' | 'oidc';
  idp_name: string;
  saml_metadata_url?: string;
  saml_entity_id?: string;
  saml_sso_url?: string;
  saml_x509_cert?: string;
  oidc_issuer_url?: string;
  oidc_client_id?: string;
  oidc_client_secret?: string;
  email_attribute: string;
  name_attribute: string;
  enabled: boolean;
  enforce_for_all_users: boolean;
  domain_hint?: string;
}

const EMPTY_FORM: SSOForm = {
  org_id: '', protocol: 'saml', idp_name: '',
  email_attribute: 'email', name_attribute: 'name',
  enabled: true, enforce_for_all_users: false,
};

export function SSOConfigsClient() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SSOForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [_, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const sb = createClient();
      const [configsRes, orgsRes] = await Promise.all([
        sb.rpc('nl_admin_sso_configs_list'),
        sb.from('nl_organizations').select('id, name').order('name'),
      ]);
      if (Array.isArray(configsRes.data)) setConfigs(configsRes.data);
      if (Array.isArray(orgsRes.data)) setOrgs(orgsRes.data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.org_id || !editing.idp_name) { toast.error('Org e IdP name obrigatórios'); return; }
    setSaving(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_sso_upsert', {
        p_id: editing.id || null,
        p_org_id: editing.org_id,
        p_protocol: editing.protocol,
        p_idp_name: editing.idp_name,
        p_saml_metadata_url: editing.saml_metadata_url || null,
        p_saml_entity_id: editing.saml_entity_id || null,
        p_saml_sso_url: editing.saml_sso_url || null,
        p_saml_x509_cert: editing.saml_x509_cert || null,
        p_oidc_issuer_url: editing.oidc_issuer_url || null,
        p_oidc_client_id: editing.oidc_client_id || null,
        p_oidc_client_secret: editing.oidc_client_secret || null,
        p_email_attribute: editing.email_attribute,
        p_name_attribute: editing.name_attribute,
        p_enabled: editing.enabled,
        p_enforce_for_all_users: editing.enforce_for_all_users,
        p_domain_hint: editing.domain_hint || null,
      });
      if (error) throw error;
      toast.success('Guardado');
      setEditing(null);
      startTransition(load);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('Eliminar esta configuração SSO?')) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_sso_delete', { p_id: id });
      toast.success('Eliminado');
      load();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...EMPTY_FORM })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">
          <Plus className="h-4 w-4" /> Nova configuração
        </button>
      </div>

      {loading ? <SkeletonList rows={3} /> : configs.length === 0 ? (
        <EmptyState icon={<Shield className="h-6 w-6" />} title="Sem SSO configurado"
          description="Activa SAML 2.0 ou OIDC para empresas que precisem de SSO empresarial."
          cta={{ label: 'Criar primeira config', onClick: () => setEditing({ ...EMPTY_FORM }) }} />
      ) : (
        <div className="space-y-2">
          {configs.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-brand-300 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-100 to-violet-100 text-brand-700 flex items-center justify-center font-bold text-xs uppercase">
                {c.protocol}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 truncate">{c.idp_name}</h3>
                  {c.enabled ? <span className="text-[10px] uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">activo</span> :
                   <span className="text-[10px] uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">desactivado</span>}
                  {c.enforce_for_all_users && <span className="text-[10px] uppercase px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded font-bold">obrigatório</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{c.org_name} · {c.domain_hint || 'sem domain hint'}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={async () => {
                  // Hidrata form (reusa o que vem da lista; campos opcionais precisam de fetch separado mas mantemos minimal)
                  setEditing({
                    id: c.id, org_id: c.org_id, protocol: c.protocol, idp_name: c.idp_name,
                    email_attribute: 'email', name_attribute: 'name',
                    enabled: c.enabled, enforce_for_all_users: c.enforce_for_all_users,
                    domain_hint: c.domain_hint || '',
                  });
                }} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(c.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">{editing.id ? 'Editar' : 'Nova'} configuração SSO</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Organização</span>
                  <select value={editing.org_id} onChange={(e) => setEditing({ ...editing, org_id: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400">
                    <option value="">Escolher...</option>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Protocolo</span>
                  <select value={editing.protocol} onChange={(e) => setEditing({ ...editing, protocol: e.target.value as 'saml' | 'oidc' })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400">
                    <option value="saml">SAML 2.0</option>
                    <option value="oidc">OIDC</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">IdP Name</span>
                <input value={editing.idp_name} onChange={(e) => setEditing({ ...editing, idp_name: e.target.value })} placeholder="Ex: Okta, Azure AD"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Domain hint (opcional)</span>
                <input value={editing.domain_hint || ''} onChange={(e) => setEditing({ ...editing, domain_hint: e.target.value })} placeholder="company.com"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </label>

              {editing.protocol === 'saml' ? (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">SAML metadata URL</span>
                    <input value={editing.saml_metadata_url || ''} onChange={(e) => setEditing({ ...editing, saml_metadata_url: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700">Entity ID</span>
                      <input value={editing.saml_entity_id || ''} onChange={(e) => setEditing({ ...editing, saml_entity_id: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700">SSO URL</span>
                      <input value={editing.saml_sso_url || ''} onChange={(e) => setEditing({ ...editing, saml_sso_url: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">X.509 cert</span>
                    <textarea value={editing.saml_x509_cert || ''} onChange={(e) => setEditing({ ...editing, saml_x509_cert: e.target.value })} rows={3}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 font-mono" />
                  </label>
                </div>
              ) : (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-700">Issuer URL</span>
                    <input value={editing.oidc_issuer_url || ''} onChange={(e) => setEditing({ ...editing, oidc_issuer_url: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700">Client ID</span>
                      <input value={editing.oidc_client_id || ''} onChange={(e) => setEditing({ ...editing, oidc_client_id: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700">Client Secret</span>
                      <input type="password" value={editing.oidc_client_secret || ''} onChange={(e) => setEditing({ ...editing, oidc_client_secret: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                    </label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Email attribute</span>
                  <input value={editing.email_attribute} onChange={(e) => setEditing({ ...editing, email_attribute: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Name attribute</span>
                  <input value={editing.name_attribute} onChange={(e) => setEditing({ ...editing, name_attribute: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                </label>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} />
                  Activo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.enforce_for_all_users} onChange={(e) => setEditing({ ...editing, enforce_for_all_users: e.target.checked })} />
                  Obrigatório para todos da org
                </label>
              </div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

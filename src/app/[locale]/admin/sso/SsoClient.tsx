'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Plus, ShieldCheck, ShieldOff, Trash2, Edit3, X, Building2, AlertCircle } from 'lucide-react';

type SsoConfig = {
  id: string;
  org_id: string | null;
  org_name?: string | null;
  protocol: string;
  idp_name: string | null;
  saml_metadata_url?: string | null;
  saml_entity_id?: string | null;
  saml_sso_url?: string | null;
  saml_x509_cert?: string | null;
  oidc_issuer_url?: string | null;
  oidc_client_id?: string | null;
  oidc_client_secret?: string | null;
  email_attribute?: string | null;
  name_attribute?: string | null;
  enabled?: boolean | null;
  enforce_for_all_users?: boolean | null;
  domain_hint?: string | null;
};

type Org = { id: string; name: string; slug?: string };

export function SsoClient({ configs, orgs }: { configs: SsoConfig[]; orgs: Org[] }) {
  const [editing, setEditing] = useState<Partial<SsoConfig> | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function save(form: Partial<SsoConfig>) {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_sso_upsert', {
        p_id: editing?.id || null,
        p_org_id: form.org_id || null,
        p_protocol: form.protocol || 'saml',
        p_idp_name: form.idp_name || null,
        p_saml_metadata_url: form.saml_metadata_url || null,
        p_saml_entity_id: form.saml_entity_id || null,
        p_saml_sso_url: form.saml_sso_url || null,
        p_saml_x509_cert: form.saml_x509_cert || null,
        p_oidc_issuer_url: form.oidc_issuer_url || null,
        p_oidc_client_id: form.oidc_client_id || null,
        p_oidc_client_secret: form.oidc_client_secret || null,
        p_email_attribute: form.email_attribute || null,
        p_name_attribute: form.name_attribute || null,
        p_enabled: form.enabled !== false,
        p_enforce_for_all_users: form.enforce_for_all_users === true,
        p_domain_hint: form.domain_hint || null,
      });
      if (error) throw error;
      toast.success('Configuração guardada');
      setEditing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao guardar');
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Apagar esta configuração SSO? Os utilizadores afectados deixarão de poder usar SSO.')) return;
    setBusy(true);
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_sso_delete', { p_id: id });
      toast.success('Configuração removida');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm text-slate-900">{configs.length} configurações</h2>
            <p className="text-xs text-slate-500 mt-0.5">SAML 2.0 e OpenID Connect</p>
          </div>
          <button
            onClick={() => setEditing({ protocol: 'saml', enabled: true })}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
            <Plus className="h-4 w-4" /> Nova configuração
          </button>
        </div>

        {configs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Sem configurações SSO</h3>
            <p className="text-sm text-slate-500">Adiciona uma configuração para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {configs.map((c) => (
              <div key={c.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {c.enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900">{c.idp_name || 'IdP'}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{c.protocol}</span>
                    {c.enforce_for_all_users && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">Enforce</span>
                    )}
                    {!c.enabled && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">Inativo</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" />
                    {c.org_name || 'Global'}
                    {c.domain_hint && (
                      <>
                        <span>·</span>
                        <span className="font-mono">@{c.domain_hint}</span>
                      </>
                    )}
                  </div>
                  {(c.saml_sso_url || c.oidc_issuer_url) && (
                    <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                      {c.saml_sso_url || c.oidc_issuer_url}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(c)} className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-violet-600" title="Editar">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => del(c.id)} disabled={busy} className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-rose-600 disabled:opacity-50" title="Apagar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing !== null && (
        <SsoModal initial={editing} orgs={orgs} busy={busy} onSave={save} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function SsoModal({ initial, orgs, busy, onSave, onClose }: {
  initial: Partial<SsoConfig>;
  orgs: Org[];
  busy: boolean;
  onSave: (form: Partial<SsoConfig>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<SsoConfig>>({ ...initial });
  const isSaml = (form.protocol || 'saml') === 'saml';

  function handleChange<K extends keyof SsoConfig>(field: K, value: SsoConfig[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 p-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{initial.id ? 'Editar' : 'Nova'} configuração SSO</h2>
            <p className="text-xs text-slate-500 mt-0.5">SAML 2.0 ou OIDC</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Organização" hint="Deixa em branco para SSO global">
            <select
              value={form.org_id || ''}
              onChange={(e) => handleChange('org_id', (e.target.value || null) as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
              <option value="">— Global (todas as orgs) —</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>

          <Field label="Nome do IdP" required>
            <input type="text" value={form.idp_name || ''}
              onChange={(e) => handleChange('idp_name', e.target.value as any)}
              placeholder="Okta · Azure AD · Google Workspace"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Protocolo">
              <select value={form.protocol || 'saml'}
                onChange={(e) => handleChange('protocol', e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
                <option value="saml">SAML 2.0</option>
                <option value="oidc">OIDC</option>
              </select>
            </Field>
            <Field label="Domínio (hint)" hint="ex: acme.com">
              <input type="text" value={form.domain_hint || ''}
                onChange={(e) => handleChange('domain_hint', e.target.value as any)}
                placeholder="acme.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
            </Field>
          </div>

          {isSaml ? (
            <>
              <Field label="SAML Metadata URL" hint="Se fornecido, sobrepõe os outros campos SAML">
                <input type="url" value={form.saml_metadata_url || ''}
                  onChange={(e) => handleChange('saml_metadata_url', e.target.value as any)}
                  placeholder="https://example.okta.com/app/.../metadata"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
              </Field>
              <Field label="SAML Entity ID">
                <input type="text" value={form.saml_entity_id || ''}
                  onChange={(e) => handleChange('saml_entity_id', e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
              </Field>
              <Field label="SAML SSO URL">
                <input type="url" value={form.saml_sso_url || ''}
                  onChange={(e) => handleChange('saml_sso_url', e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
              </Field>
              <Field label="SAML X.509 Certificate">
                <textarea value={form.saml_x509_cert || ''}
                  onChange={(e) => handleChange('saml_x509_cert', e.target.value as any)}
                  rows={4} placeholder="-----BEGIN CERTIFICATE-----..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-y" />
              </Field>
            </>
          ) : (
            <>
              <Field label="OIDC Issuer URL" required>
                <input type="url" value={form.oidc_issuer_url || ''}
                  onChange={(e) => handleChange('oidc_issuer_url', e.target.value as any)}
                  placeholder="https://accounts.google.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="OIDC Client ID">
                  <input type="text" value={form.oidc_client_id || ''}
                    onChange={(e) => handleChange('oidc_client_id', e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
                </Field>
                <Field label="OIDC Client Secret">
                  <input type="password" value={form.oidc_client_secret || ''}
                    onChange={(e) => handleChange('oidc_client_secret', e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
                </Field>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email attribute" hint="Mapping (opcional)">
              <input type="text" value={form.email_attribute || ''}
                onChange={(e) => handleChange('email_attribute', e.target.value as any)}
                placeholder="email · NameID"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
            </Field>
            <Field label="Name attribute">
              <input type="text" value={form.name_attribute || ''}
                onChange={(e) => handleChange('name_attribute', e.target.value as any)}
                placeholder="name · displayName"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
            </Field>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <CheckboxRow
              checked={form.enabled !== false}
              onChange={(v: boolean) => handleChange('enabled', v as any)}
              label="Configuração ativa"
              hint="Quando inativa, os utilizadores não vêem este provider"
            />
            <CheckboxRow
              checked={form.enforce_for_all_users === true}
              onChange={(v: boolean) => handleChange('enforce_for_all_users', v as any)}
              label="Enforce para todos os utilizadores da org"
              hint="Bloqueia login por password — só SSO aceite"
              warning
            />
          </div>
        </div>

        <div className="border-t border-slate-100 p-4 flex items-center justify-end gap-2 flex-shrink-0 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-white rounded-lg font-medium">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={busy || !form.idp_name}
            className="px-5 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? 'A guardar…' : 'Guardar configuração'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</span>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function CheckboxRow({ checked, onChange, label, hint, warning }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  warning?: boolean;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input type="checkbox" checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500" />
      <div className="flex-1">
        <div className="text-sm text-slate-900 font-medium">{label}</div>
        {hint && (
          <div className={`text-xs mt-0.5 ${warning ? 'text-amber-700' : 'text-slate-500'}`}>
            {warning && <AlertCircle className="h-3 w-3 inline mr-1 -mt-0.5" />}
            {hint}
          </div>
        )}
      </div>
    </label>
  );
}

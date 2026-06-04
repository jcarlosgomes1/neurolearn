'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { toast } from 'sonner';

interface AuthConfig {
  external_google_enabled?: boolean;
  external_google_client_id?: string;
  external_google_secret?: string;
  external_github_enabled?: boolean;
  external_github_client_id?: string;
  external_github_secret?: string;
  external_azure_enabled?: boolean;
  external_azure_client_id?: string;
  external_azure_secret?: string;
  password_min_length?: number;
  password_required_characters?: string;
  security_check_password_policy_enabled?: boolean;
  security_refresh_token_rotation_enabled?: boolean;
  mfa_totp_enroll_enabled?: boolean;
  mfa_totp_verify_enabled?: boolean;
  site_url?: string;
  uri_allow_list?: string;
  jwt_exp?: number;
}

interface Props { locale: string; supabaseCallbackUrl: string }

export function AuthConfigClient({ locale, supabaseCallbackUrl }: Props) {
  const t = useTranslations();
  const supabase = createClient();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [draft, setDraft] = useState<AuthConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); setLoading(false); return; }
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth-config`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await resp.json();
      if (data.ok) {
        setConfig(data.config);
        setDraft({});
      } else {
        toast.error(data.error || 'Failed to load');
      }
    } catch (e) {
      toast.error('Network error');
    }
    setLoading(false);
  }

  async function saveSection(fields: string[]) {
    const updates: Record<string, unknown> = {};
    for (const f of fields) if (f in draft) updates[f] = (draft as any)[f];
    if (Object.keys(updates).length === 0) { toast.info('No changes'); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(updates),
      });
      const data = await resp.json();
      if (data.ok) {
        toast.success(t('admin.auth.saved'));
        setConfig(data.config);
        setDraft({});
      } else {
        toast.error(`${t('admin.auth.save_error')}: ${data.detail || data.error}`);
      }
    } catch (e) {
      toast.error(t('admin.auth.save_error'));
    }
    setSaving(false);
  }

  function update<K extends keyof AuthConfig>(key: K, value: AuthConfig[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function effective<K extends keyof AuthConfig>(key: K): AuthConfig[K] | undefined {
    if (key in draft) return (draft as any)[key];
    return config?.[key];
  }

  if (loading) return <div className="text-center py-12 text-slate-400">…</div>;
  if (!config) return <div className="text-center py-12 text-slate-500">Failed to load configuration.</div>;

  return (
    <div className="space-y-6">
      {/* Redirect URL hint */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-sm">
        <p className="text-slate-700 mb-1">{t('admin.auth.redirect_hint')}</p>
        <code className="block bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs break-all">{supabaseCallbackUrl}</code>
      </div>

      {/* GOOGLE */}
      <ProviderCard
        emoji="🔵" name="Google"
        provider="google"
        enabled={!!effective('external_google_enabled')}
        clientId={String(effective('external_google_client_id') || '')}
        secretPreview={String(config.external_google_secret || '')}
        onToggle={(v) => update('external_google_enabled', v)}
        onClientId={(v) => update('external_google_client_id', v)}
        onSecret={(v) => update('external_google_secret', v)}
        onSave={() => saveSection(['external_google_enabled', 'external_google_client_id', 'external_google_secret'])}
        saving={saving}
        setupUrl="https://console.cloud.google.com/apis/credentials"
        t={t}
      />

      {/* GITHUB */}
      <ProviderCard
        emoji="⚫" name="GitHub"
        provider="github"
        enabled={!!effective('external_github_enabled')}
        clientId={String(effective('external_github_client_id') || '')}
        secretPreview={String(config.external_github_secret || '')}
        onToggle={(v) => update('external_github_enabled', v)}
        onClientId={(v) => update('external_github_client_id', v)}
        onSecret={(v) => update('external_github_secret', v)}
        onSave={() => saveSection(['external_github_enabled', 'external_github_client_id', 'external_github_secret'])}
        saving={saving}
        setupUrl="https://github.com/settings/developers"
        t={t}
      />

      {/* MICROSOFT */}
      <ProviderCard
        emoji="🟦" name="Microsoft (Azure)"
        provider="azure"
        enabled={!!effective('external_azure_enabled')}
        clientId={String(effective('external_azure_client_id') || '')}
        secretPreview={String(config.external_azure_secret || '')}
        onToggle={(v) => update('external_azure_enabled', v)}
        onClientId={(v) => update('external_azure_client_id', v)}
        onSecret={(v) => update('external_azure_secret', v)}
        onSave={() => saveSection(['external_azure_enabled', 'external_azure_client_id', 'external_azure_secret'])}
        saving={saving}
        setupUrl="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps"
        t={t}
      />

      {/* PASSWORD POLICY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4">🔑 {t('admin.auth.policy')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.auth.min_length')}</label>
            <input type="number" min={6} max={32}
              value={Number(effective('password_min_length') ?? 12)}
              onChange={(e) => update('password_min_length', Math.max(6, Math.min(32, Number(e.target.value))))}
              className="input w-32" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.auth.required_chars')}</label>
            <select value={String(effective('password_required_characters') ?? '')}
              onChange={(e) => update('password_required_characters', e.target.value)}
              className="input w-full max-w-md">
              <option value="">None</option>
              <option value="letters_digits">Letters + digits</option>
              <option value="lower_upper_letters_digits">Lower + upper + digits</option>
              <option value="lower_upper_letters_digits_symbols">Lower + upper + digits + symbols</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox"
              checked={!!effective('security_check_password_policy_enabled')}
              onChange={(e) => update('security_check_password_policy_enabled', e.target.checked)} />
            <span className="text-sm text-slate-700">{t('admin.auth.leaked_check')}</span>
          </label>
          <button onClick={() => saveSection(['password_min_length', 'password_required_characters', 'security_check_password_policy_enabled'])}
            disabled={saving} className="btn-primary">
            {t('admin.auth.save')}
          </button>
        </div>
      </div>

      {/* MFA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4">📱 {t('admin.auth.mfa')}</h3>
        <label className="flex items-center gap-3 cursor-pointer mb-3">
          <input type="checkbox"
            checked={!!effective('mfa_totp_enroll_enabled')}
            onChange={(e) => update('mfa_totp_enroll_enabled', e.target.checked)} />
          <span className="text-sm text-slate-700">{t('admin.auth.totp_enroll')}</span>
        </label>
        <button onClick={() => saveSection(['mfa_totp_enroll_enabled', 'mfa_totp_verify_enabled'])}
          disabled={saving} className="btn-primary">
          {t('admin.auth.save')}
        </button>
      </div>
    </div>
  );
}

interface ProviderCardProps {
  emoji: string; name: string; provider: string;
  enabled: boolean; clientId: string; secretPreview: string;
  onToggle: (v: boolean) => void;
  onClientId: (v: string) => void;
  onSecret: (v: string) => void;
  onSave: () => void;
  saving: boolean; setupUrl: string;
  t: (k: string) => string;
}

function ProviderCard({ emoji, name, enabled, clientId, secretPreview, onToggle, onClientId, onSecret, onSave, saving, setupUrl, t }: ProviderCardProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">{emoji} {name}</h3>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          <span className="text-sm text-slate-600">{t('admin.auth.enabled')}</span>
        </label>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('admin.auth.client_id')}</label>
          <input type="text" value={clientId} onChange={(e) => onClientId(e.target.value)} className="input w-full" placeholder="..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('admin.auth.client_secret')}</label>
          <div className="flex gap-2">
            <input type={showSecret ? 'text' : 'password'}
              value={secretInput}
              onChange={(e) => { setSecretInput(e.target.value); onSecret(e.target.value); }}
              className="input flex-1"
              placeholder={secretPreview || t('admin.auth.secret_unchanged')} />
            <button type="button" onClick={() => setShowSecret(!showSecret)} className="px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">
              {showSecret ? '🙈' : '👁'}
            </button>
          </div>
          {secretPreview && !secretInput && <p className="text-xs text-slate-400 mt-1">Current: {secretPreview}</p>}
        </div>
        <div className="flex items-center justify-between pt-2">
          <a href={setupUrl} target="_blank" rel="noopener" className="text-xs text-brand-600 hover:underline">
            ↗ Setup guide
          </a>
          <button onClick={onSave} disabled={saving} className="btn-primary text-sm">
            {t('admin.auth.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

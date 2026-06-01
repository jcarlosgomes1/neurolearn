'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Connection {
  id: string; provider: string; external_username: string | null; external_display_name: string | null;
  scope: string | null; expires_at: string | null; is_active: boolean; connected_at: string; last_used_at: string | null;
}

interface PublishLog {
  id: number; provider: string; external_post_url: string | null; status: string;
  error_message: string | null; created_at: string;
}

const PROVIDER_META: Record<string, { label: string; emoji: string; color: string }> = {
  linkedin: { label: 'LinkedIn', emoji: '💼', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  twitter: { label: 'Twitter / X', emoji: '🐦', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  facebook: { label: 'Facebook', emoji: '📘', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export function SocialView() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [linkedinConfigured, setLinkedinConfigured] = useState(false);
  const [twitterConfigured, setTwitterConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Toast after callback redirect
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) toast.success(`Conectado: ${connected}`);
    if (error) toast.error(`Erro OAuth: ${error}`);
  }, [searchParams]);

  async function callApi(endpoint: string, body: any) {
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Sem sessão');
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function load() {
    try {
      const data = await callApi('social-oauth', { action: 'list' });
      if (!data.ok) throw new Error(data.error);
      setConnections(data.connections || []);
      setLinkedinConfigured(data.linkedin_configured);
      setTwitterConfigured(data.twitter_configured);

      const sb = createClient();
      const { data: logsData } = await sb.from('nl_social_publish_logs')
        .select('id, provider, external_post_url, status, error_message, created_at')
        .order('created_at', { ascending: false }).limit(20);
      setLogs((logsData as PublishLog[]) || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function connect(provider: string) {
    setConnecting(provider);
    try {
      const data = await callApi('social-oauth', { action: 'start', provider });
      if (!data.ok) {
        if (data.error?.includes('_not_configured')) {
          toast.error(`${PROVIDER_META[provider]?.label || provider} ainda não configurado. Adiciona ${provider.toUpperCase()}_CLIENT_ID e ${provider.toUpperCase()}_CLIENT_SECRET aos secrets.`);
        } else { toast.error(data.error); }
        setConnecting(null); return;
      }
      window.location.href = data.auth_url;
    } catch (e: any) { toast.error(e.message); setConnecting(null); }
  }

  async function disconnect(id: string) {
    if (!confirm('Desligar esta conta?')) return;
    try {
      await callApi('social-oauth', { action: 'disconnect', connection_id: id });
      toast.success('Conta desligada');
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  const activeConnections = connections.filter(c => c.is_active);
  const activeByProvider = activeConnections.reduce((acc, c) => { acc[c.provider] = c; return acc; }, {} as Record<string, Connection>);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
      <div className="mt-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📣 Social Publishing</h1>
        <p className="text-sm text-slate-500 mt-1">Liga contas LinkedIn e Twitter/X para publicar automaticamente os posts do agente.</p>
      </div>

      {loading ? (
        <div className="mt-8 text-center text-slate-400 py-10">A carregar...</div>
      ) : (
        <>
          <section className="mt-6 grid sm:grid-cols-2 gap-4">
            {(['linkedin', 'twitter'] as const).map(provider => {
              const meta = PROVIDER_META[provider];
              const configured = provider === 'linkedin' ? linkedinConfigured : twitterConfigured;
              const conn = activeByProvider[provider];
              return (
                <div key={provider} className={`rounded-xl border p-5 ${conn ? 'bg-emerald-50 border-emerald-200' : configured ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900">{meta.label}</div>
                      <div className="text-xs text-slate-500">
                        {conn ? `✓ ${conn.external_display_name || conn.external_username || 'Conectado'}` 
                          : configured ? '⏸ Sem conta ligada' 
                          : `⚠ Secrets em falta (${provider.toUpperCase()}_CLIENT_ID)`}
                      </div>
                    </div>
                  </div>
                  {conn ? (
                    <div className="space-y-2 text-xs">
                      <div className="text-slate-600">Conectado {new Date(conn.connected_at).toLocaleDateString('pt-PT')}</div>
                      {conn.last_used_at && <div className="text-slate-600">Última publicação: {new Date(conn.last_used_at).toLocaleString('pt-PT')}</div>}
                      <button onClick={() => disconnect(conn.id)} className="mt-2 text-xs bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium px-3 py-1.5 rounded-md">
                        Desligar
                      </button>
                    </div>
                  ) : configured ? (
                    <button onClick={() => connect(provider)} disabled={connecting === provider}
                      className="mt-2 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md">
                      {connecting === provider ? 'A abrir...' : `Conectar ${meta.label}`}
                    </button>
                  ) : (
                    <div className="mt-2 text-xs text-amber-800">
                      Cria app em <strong>{provider === 'linkedin' ? 'linkedin.com/developers' : 'developer.twitter.com'}</strong> e adiciona <code className="font-mono bg-white px-1 rounded">{provider.toUpperCase()}_CLIENT_ID</code> e <code className="font-mono bg-white px-1 rounded">{provider.toUpperCase()}_CLIENT_SECRET</code> nos Supabase secrets.
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <section className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-900 mb-3">🔧 Setup de cada plataforma</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <details className="bg-white rounded-lg p-3">
                <summary className="cursor-pointer font-semibold">💼 LinkedIn</summary>
                <ol className="mt-3 space-y-1.5 text-xs">
                  <li>1. Cria app em <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener" className="text-brand-600 underline">linkedin.com/developers/apps</a></li>
                  <li>2. Em "Products", adiciona <strong>Share on LinkedIn</strong> + <strong>Sign In with LinkedIn using OpenID Connect</strong></li>
                  <li>3. Em "Auth", regista o redirect URL:<br/><code className="text-[10px] bg-slate-100 px-1 rounded break-all">{SUPABASE_URL}/functions/v1/social-oauth?action=callback</code></li>
                  <li>4. Em Supabase secrets: <code className="text-[10px] bg-slate-100 px-1 rounded">LINKEDIN_CLIENT_ID</code> e <code className="text-[10px] bg-slate-100 px-1 rounded">LINKEDIN_CLIENT_SECRET</code></li>
                  <li>5. Adiciona também <code className="text-[10px] bg-slate-100 px-1 rounded">SITE_URL</code> = <code className="text-[10px] bg-slate-100 px-1 rounded">https://neurolearn-rosy.vercel.app</code></li>
                  <li>6. Volta aqui e clica "Conectar LinkedIn"</li>
                </ol>
              </details>
              <details className="bg-white rounded-lg p-3">
                <summary className="cursor-pointer font-semibold">🐦 Twitter / X</summary>
                <ol className="mt-3 space-y-1.5 text-xs">
                  <li>1. Cria app em <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener" className="text-brand-600 underline">developer.twitter.com</a></li>
                  <li>2. Activa <strong>OAuth 2.0</strong> com tipo "Web App"</li>
                  <li>3. Permissões: <strong>Read and Write</strong></li>
                  <li>4. Callback URL: <code className="text-[10px] bg-slate-100 px-1 rounded break-all">{SUPABASE_URL}/functions/v1/social-oauth?action=callback</code></li>
                  <li>5. Secrets Supabase: <code className="text-[10px] bg-slate-100 px-1 rounded">TWITTER_CLIENT_ID</code> e <code className="text-[10px] bg-slate-100 px-1 rounded">TWITTER_CLIENT_SECRET</code></li>
                </ol>
              </details>
            </div>
          </section>

          {logs.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">📋 Histórico de publicações (20 mais recentes)</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {logs.map(log => {
                  const meta = PROVIDER_META[log.provider] || { label: log.provider, emoji: '📣', color: '' };
                  return (
                    <div key={log.id} className="p-3 flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {log.status}
                          </span>
                          <span className="text-sm font-medium text-slate-900">{meta.label}</span>
                          <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString('pt-PT')}</span>
                        </div>
                        {log.error_message && <div className="text-xs text-rose-600 mt-1 truncate">{log.error_message}</div>}
                      </div>
                      {log.external_post_url && (
                        <a href={log.external_post_url} target="_blank" rel="noopener" className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-medium whitespace-nowrap">
                          Ver post →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

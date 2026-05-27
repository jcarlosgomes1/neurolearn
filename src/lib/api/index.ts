import 'server-only';
import { createClient as createServerClient } from '@/lib/supabase/server';

export type ApiResult<T = any> = { ok: true } & T | { ok: false; error: string; details?: unknown };

interface ApiOptions {
  baseUrl?: string;
  token?: string;
  agentKey?: string;
}

export class NeuroLearnApi {
  private baseUrl: string;
  private token?: string;
  private agentKey?: string;

  constructor(opts: ApiOptions = {}) {
    this.baseUrl = opts.baseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.token = opts.token;
    this.agentKey = opts.agentKey;
  }

  async invoke<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.agentKey) headers['x-agent-key'] = this.agentKey;

    const res = await fetch(`${this.baseUrl}/functions/v1/agent-ops`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({ ok: false, error: 'invalid_json' }));
    if (!data.ok) {
      throw new Error(data.error || `Action ${action} failed`);
    }
    return data as T;
  }

  async bootstrap(lang = 'pt') {
    const res = await fetch(`${this.baseUrl}/functions/v1/app-bootstrap?lang=${lang}`, {
      next: { revalidate: 60, tags: [`bootstrap:${lang}`] },
    });
    return res.json();
  }

  async whoami() {
    if (!this.token) return null;
    const res = await fetch(`${this.baseUrl}/functions/v1/auth-whoami`, {
      headers: { Authorization: `Bearer ${this.token}` },
      cache: 'no-store',
    });
    return res.json();
  }
}

export async function getServerApi() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return new NeuroLearnApi({ token: session?.access_token });
}

export function getPublicApi() {
  return new NeuroLearnApi();
}

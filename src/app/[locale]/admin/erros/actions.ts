'use server';

import { createClient } from '@/lib/supabase/server';

interface ErrorPayload {
  message: string;
  stack: string | null;
  digest: string | null;
  url: string;
  userAgent: string;
  kind: string;
}

/**
 * Logs a client-side error to nl_client_telemetry. Anonymous-friendly,
 * uses RPC nl_telemetry_log which already accepts anon.
 */
export async function logClientErrorAction(payload: ErrorPayload): Promise<void> {
  try {
    const sb = await createClient();
    await sb.rpc('nl_telemetry_log', {
      p_event: 'react_error_boundary',
      p_context: payload.kind,
      p_data: {
        message: payload.message,
        stack: payload.stack?.slice(0, 4000) || null,
        digest: payload.digest,
        url: payload.url,
        user_agent: payload.userAgent?.slice(0, 200) || null,
      },
    });
  } catch {
    // Silent — nunca queremos que o log de um erro cause outro erro
  }
}

export async function listErrorsAction(sinceHours: number = 168) {
  try {
    const sb = await createClient();
    const [{ data: list, error: e1 }, { data: summary, error: e2 }] = await Promise.all([
      sb.rpc('nl_admin_errors_list', { p_limit: 200, p_since_hours: sinceHours }),
      sb.rpc('nl_admin_errors_summary', { p_since_hours: sinceHours }),
    ]);
    if (e1 || e2) return { ok: false, error: (e1 || e2)?.message || 'fetch_failed' };
    return { ok: true, data: { list: list || [], summary: summary || [] } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

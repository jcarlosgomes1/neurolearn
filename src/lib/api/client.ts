'use client';

import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL } from '@/lib/supabase/config';

export async function callAgentOps<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  const sb = createClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('not_authenticated');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-ops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, payload }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || `action ${action} failed`);
  return data as T;
}

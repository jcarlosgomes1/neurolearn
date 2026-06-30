'use server';

import { createClient } from '@/lib/supabase/server';

export async function scormTrackAction(
  id: string,
  scoId: string,
  cmi: Record<string, string>,
): Promise<{ ok: boolean; completed?: boolean }> {
  try {
    const sb = await createClient();
    const { data } = await sb.rpc('nl_scorm_track_set', { p_package_id: id, p_sco_id: scoId, p_cmi: cmi });
    const d = data as { ok?: boolean; completed?: boolean } | null;
    return { ok: !!d?.ok, completed: d?.completed };
  } catch {
    return { ok: false };
  }
}

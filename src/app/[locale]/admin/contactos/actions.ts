'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function listContactMessagesAction(status?: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_contact_messages_list', {
    p_status: status || null,
    p_limit: 200,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, messages: data };
}

export async function setContactStatusAction(id: string, status: string) {
  const sb = await createClient();
  const { error } = await sb.rpc('nl_admin_contact_message_set_status', {
    p_id: id,
    p_status: status,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/contactos');
  return { ok: true };
}

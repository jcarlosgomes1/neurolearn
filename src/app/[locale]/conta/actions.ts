'use server';

import { createClient } from '@/lib/supabase/server';
import { assertNotPeek } from '@/lib/peek';
import { revalidatePath } from 'next/cache';

// ============ NOTIFICAÇÕES ============

export async function listNotificationsAction(unreadOnly = false, limit = 20) {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_notifications_list', { p_unread_only: unreadOnly, p_limit: limit });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data || [] };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function getUnreadCountAction() {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_notifications_unread_count');
    if (error) return { ok: false, error: error.message, count: 0 };
    return { ok: true, count: (data as number) || 0 };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e), count: 0 }; }
}

export async function markNotificationReadAction(notificationId?: string) {
  try {
    await assertNotPeek();
    const sb = await createClient();
    const { error } = await sb.rpc('nl_notifications_mark_read', { p_notification_id: notificationId || null });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/[locale]', 'layout');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    await assertNotPeek();
    const sb = await createClient();
    const { error } = await sb.rpc('nl_notifications_delete', { p_notification_id: notificationId });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// ============ GDPR ============

export async function requestDataExportAction() {
  try {
    await assertNotPeek();
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_gdpr_request_export');
    if (error) return { ok: false, error: error.message };
    const r = data as { ok: boolean; error?: string; request_id?: string };
    if (!r.ok) return { ok: false, error: r.error || 'failed' };
    revalidatePath('/[locale]/conta/privacidade', 'page');
    return { ok: true, data: { request_id: r.request_id } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function requestAccountDeletionAction(reason?: string) {
  try {
    await assertNotPeek();
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_gdpr_request_deletion', { p_reason: reason || null });
    if (error) return { ok: false, error: error.message };
    const r = data as { ok: boolean; error?: string; scheduled_deletion_at?: string };
    if (!r.ok) return { ok: false, error: r.error || 'failed' };
    revalidatePath('/[locale]/conta/privacidade', 'page');
    return { ok: true, data: { scheduled_deletion_at: r.scheduled_deletion_at } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function cancelAccountDeletionAction() {
  try {
    await assertNotPeek();
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_gdpr_cancel_deletion');
    if (error) return { ok: false, error: error.message };
    revalidatePath('/[locale]/conta/privacidade', 'page');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function getGdprRequestsAction() {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_gdpr_my_requests');
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data as any[]) || [] };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

// ============ SECURITY ============

export async function changePasswordAction(newPassword: string) {
  try {
    await assertNotPeek();
    if (!newPassword || newPassword.length < 8) return { ok: false, error: 'A password tem de ter pelo menos 8 caracteres' };
    const sb = await createClient();
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

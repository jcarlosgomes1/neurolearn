'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function browseMarketplaceCoursesAction(filters: {
  search?: string; category?: string; level?: string; maxPriceCents?: number;
}) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_marketplace_courses_browse', {
    p_search: filters.search || null, p_category: filters.category || null,
    p_level: filters.level || null, p_max_price_cents: filters.maxPriceCents || null,
    p_limit: 50, p_offset: 0,
  });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function subscribeCourseAction(orgId: string, courseId: string, pricingModel: 'per_seat'|'flat_fee'|'unlimited', seats?: number, customTotalCents?: number) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_marketplace_org_subscribe_course', {
    p_org_id: orgId, p_course_id: courseId, p_pricing_model: pricingModel,
    p_seats: seats || null, p_custom_total_cents: customTotalCents || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/empresa', 'layout');
  return data as any;
}

export async function listOrgSubscriptionsAction(orgId: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_marketplace_org_subscriptions_list', { p_org_id: orgId });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

export async function enrollUserInCourseAction(orgCourseId: string, userId: string) {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_marketplace_org_enroll_user', {
    p_org_course_id: orgCourseId, p_user_id: userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/empresa', 'layout');
  return data as any;
}

export async function instructorB2BEarningsAction() {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_marketplace_instructor_b2b_earnings');
  if (error) return { ok: false, error: error.message };
  return data as any;
}

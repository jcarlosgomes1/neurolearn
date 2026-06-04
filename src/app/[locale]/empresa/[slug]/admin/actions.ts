'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getOrgContext(slug: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug, plan, seats_used, seats_purchased, trial_ends_at, country_code, legal_name').eq('slug', slug).maybeSingle();
  if (!org) return null;
  const { data: m } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!m) return null;
  return { sb, org, user, role: m.role };
}

export async function getOrgAdminOverviewAction(slug: string) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    if (!['owner','admin'].includes(ctx.role)) return { ok: false, error: 'insufficient_role' };
    const { sb, org } = ctx;
    const [
      { data: usageSummary },
      { count: courseCount },
      { count: contentCount },
      { count: proposalCount },
      { data: branding },
      { data: plans },
    ] = await Promise.all([
      sb.rpc('nl_org_usage_summary', { p_org_id: org.id }),
      sb.from('nl_courses').select('*', { count: 'exact', head: true }).eq('org_id', org.id).eq('archived', false),
      sb.from('nl_org_content').select('*', { count: 'exact', head: true }).eq('org_id', org.id).eq('archived', false),
      sb.from('nl_org_course_proposals').select('*', { count: 'exact', head: true }).eq('org_id', org.id),
      sb.from('nl_org_branding').select('*').eq('org_id', org.id).maybeSingle(),
      sb.rpc('nl_billing_plans_public_list'),
    ]);
    return {
      ok: true,
      data: {
        org, role: ctx.role,
        usage: usageSummary,
        counts: { courses: courseCount || 0, contents: contentCount || 0, proposals: proposalCount || 0 },
        branding: branding || null,
        plans: (plans as any[]) || [],
      },
    };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function updateBrandingAction(slug: string, branding: Record<string, unknown>) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    if (!['owner','admin'].includes(ctx.role)) return { ok: false, error: 'insufficient_role' };
    const { sb, org } = ctx;
    const { error } = await sb.from('nl_org_branding').upsert({
      org_id: org.id, ...branding, updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id' });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/[locale]/empresa/${slug}/admin`, 'page');
    revalidatePath(`/[locale]/empresa/${slug}`, 'layout');
    return { ok: true };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function stripeCheckoutAction(slug: string, planId: string, cycle: 'monthly'|'annual') {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    if (!['owner','admin'].includes(ctx.role)) return { ok: false, error: 'insufficient_role' };
    
    const sb = await createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return { ok: false, error: 'not_authenticated' };
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obpezocujzdaznrdgwoo.supabase.co'}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ org_id: ctx.org.id, plan_id: planId, cycle }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.error || data.hint || 'checkout_failed' };
    return { ok: true, data: { checkout_url: data.checkout_url } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

export async function stripePortalAction(slug: string) {
  try {
    const ctx = await getOrgContext(slug);
    if (!ctx) return { ok: false, error: 'forbidden' };
    if (!['owner','admin'].includes(ctx.role)) return { ok: false, error: 'insufficient_role' };
    
    const sb = await createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return { ok: false, error: 'not_authenticated' };
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obpezocujzdaznrdgwoo.supabase.co'}/functions/v1/stripe-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ org_id: ctx.org.id }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.error || data.hint || 'portal_failed' };
    return { ok: true, data: { portal_url: data.portal_url } };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

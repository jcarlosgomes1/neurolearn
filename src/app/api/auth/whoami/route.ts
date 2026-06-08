import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = await createClient();
    const { data: { user }, error: userErr } = await sb.auth.getUser();

    if (userErr) {
      return NextResponse.json({ ok: false, stage: 'getUser', error: userErr.message }, { status: 200 });
    }
    if (!user) {
      return NextResponse.json({ ok: false, stage: 'no_user', message: 'No active session' }, { status: 200 });
    }

    const { data: profile, error: profileErr } = await sb
      .from('nl_profiles')
      .select('id, name, role, is_active, last_login, preferred_lang')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, created_at: user.created_at },
      profile: profile || null,
      profile_error: profileErr?.message || null,
      can_access_admin: !!profile && ['admin', 'super_admin'].includes(profile.role),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: 'exception', error: e?.message || String(e) }, { status: 200 });
  }
}

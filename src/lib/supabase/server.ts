import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createBaseClient } from '@supabase/supabase-js';

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet: CookieToSet[]) {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component: refresh handled by middleware
          }
        },
      },
    }
  );
}

/** Service role client — server only. Never expose to browser. */
export function createAdminClient() {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export type Area = 'student' | 'instructor' | 'admin';
export type Role = 'student' | 'instructor' | 'admin' | 'super_admin';

export async function getSessionWithArea() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from('nl_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role ?? 'student') as Role;
  const area: Area =
    role === 'admin' || role === 'super_admin' ? 'admin' :
    role === 'instructor' ? 'instructor' : 'student';

  return { user, role, area };
}

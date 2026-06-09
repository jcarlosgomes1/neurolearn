import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createBaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
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
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set — required for admin operations');
  }
  return createBaseClient(
    SUPABASE_URL,
    serviceRole,
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

  const areas: Area[] =
    role === 'admin' || role === 'super_admin' ? ['admin', 'instructor', 'student'] :
    role === 'instructor' ? ['instructor', 'student'] : ['student'];

  return { user, role, area, areas };
}

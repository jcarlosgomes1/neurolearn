'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

const SKIP_PATHS = ['/login', '/signup', '/onboarding', '/legal', '/recuperar', '/redefinir', '/checkout', '/sair'];

/**
 * Invisible gate that runs once per route change.
 * Redirects authenticated users with `onboarding_completed_at IS NULL` to the
 * appropriate onboarding wizard (instructor or student) based on their role.
 * Returns null — purely a side-effect component.
 */
export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Skip on auth, onboarding and other safe routes to avoid loops
      if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from('nl_profiles')
        .select('role, onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled || !profile) return;
      if (profile.onboarding_completed_at) return;

      const target = ['instructor', 'admin', 'super_admin'].includes(profile.role || '')
        ? '/onboarding/instructor'
        : '/onboarding/student';
      router.replace(target as any);
    })();
    return () => { cancelled = true; };
  }, [pathname, router]);

  return null;
}

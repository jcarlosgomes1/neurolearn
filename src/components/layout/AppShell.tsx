import { getSessionWithArea, createClient } from '@/lib/supabase/server';
import { AppShellClient } from './AppShellClient';
import { redirect } from '@/i18n/routing';
import { headers } from 'next/headers';

export interface AppShellProps {
  role: 'admin' | 'instructor' | 'student';
  pageTitle?: string;
  children: React.ReactNode;
}

const SUPPORTED = ['pt', 'en', 'es', 'fr'] as const;
type Lang = (typeof SUPPORTED)[number];

function isSupported(l: string | null | undefined): l is Lang {
  return !!l && (SUPPORTED as readonly string[]).includes(l);
}

async function readPathname(): Promise<string> {
  try {
    const h = await headers();
    return h.get('x-invoke-path') || h.get('next-url') || h.get('x-pathname') || '';
  } catch {
    return '';
  }
}

async function readPreferredLang(userId: string): Promise<string | null> {
  try {
    const sb = await createClient();
    const { data } = await sb.from('nl_profiles').select('preferred_lang').eq('id', userId).maybeSingle();
    return data?.preferred_lang || null;
  } catch {
    return null;
  }
}

/**
 * Server component. Reads user's preferred_lang from nl_profiles
 * and redirects when the URL locale doesn't match. Redirect lives OUTSIDE
 * any try/catch (Next.js redirect throws a sentinel that must propagate).
 */
export async function AppShell({ role, pageTitle, children }: AppShellProps) {
  const session = await getSessionWithArea();

  if (session?.user?.id) {
    const pathname = await readPathname();
    const segments = pathname.split('/').filter(Boolean);
    const currentLocale = segments[0] || '';
    const pref = await readPreferredLang(session.user.id);

    if (isSupported(pref) && isSupported(currentLocale) && pref !== currentLocale) {
      const rest = '/' + segments.slice(1).join('/');
      // Throws NEXT_REDIRECT — propaga sem try/catch
      redirect({ href: (rest || '/') as any, locale: pref });
    }
  }

  return (
    <AppShellClient
      role={role}
      pageTitle={pageTitle}
      session={session ? { email: session.user.email!, area: session.area } : null}
    >
      {children}
    </AppShellClient>
  );
}

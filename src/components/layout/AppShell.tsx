import { getSessionWithArea, createClient } from '@/lib/supabase/server';
import { AppShellClient } from './AppShellClient';
import { redirect } from '@/i18n/routing';
import { headers } from 'next/headers';

export interface AppShellProps {
  role: 'admin' | 'instructor' | 'student';
  pageTitle?: string;
  children: React.ReactNode;
}

interface NavItem { href: string; labelKey: string; emoji: string; groupKey: string; badge?: string }

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

async function readNav(role: 'admin' | 'instructor' | 'student'): Promise<NavItem[]> {
  try {
    const sb = await createClient();
    const location = role === 'admin' ? 'sidebar_admin' : role === 'instructor' ? 'sidebar_instructor' : 'sidebar_student';
    const { data } = await sb
      .from('nl_nav_items')
      .select('href,i18n_key,icon,group_key,badge')
      .eq('location', location)
      .eq('enabled', true)
      .order('sort_order', { ascending: true });
    return (data || []).map((r: any) => ({
      href: r.href as string,
      labelKey: r.i18n_key as string,
      emoji: (r.icon as string) || '\u2022',
      groupKey: (r.group_key as string) || '',
      badge: (r.badge as string) || undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Server component. Reads preferred_lang and redirects when URL locale
 * mismatches. Redirect lives OUTSIDE try/catch. Sidebar nav is loaded
 * from nl_nav_items (DB-driven, no hardcode).
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
      redirect({ href: (rest || '/') as any, locale: pref });
    }
  }

  const nav = await readNav(role);

  return (
    <AppShellClient
      role={role}
      pageTitle={pageTitle}
      nav={nav}
      session={session ? { email: session.user.email!, area: session.area, areas: session.areas } : null}
    >
      {children}
    </AppShellClient>
  );
}

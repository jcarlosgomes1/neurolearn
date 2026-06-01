import { getSessionWithArea } from '@/lib/supabase/server';
import { AppShellClient } from './AppShellClient';

export interface AppShellProps {
  role: 'admin' | 'instructor' | 'student';
  pageTitle?: string;
  children: React.ReactNode;
}

export async function AppShell({ role, pageTitle, children }: AppShellProps) {
  const session = await getSessionWithArea();
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

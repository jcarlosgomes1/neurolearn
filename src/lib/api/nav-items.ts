import { createClient } from '@/lib/supabase/server';

export interface NavItem {
  id: string;
  href: string;
  i18n_key: string | null;
  label_override: string | null;
  icon: string | null;
  visibility: 'public' | 'authenticated' | 'anonymous' | 'admin';
  sort_order: number;
  external: boolean;
  badge: string | null;
}

export async function getNavItems(location: string): Promise<NavItem[]> {
  try {
    const sb = await createClient();
    const { data } = await sb.rpc('nl_nav_items_public', { p_location: location });
    return (data as NavItem[]) || [];
  } catch {
    return [];
  }
}

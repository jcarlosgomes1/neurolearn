'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommandPalette } from './CommandPalette';

export function CommandPaletteWrapper() {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
      if (data && ['admin', 'super_admin'].includes(data.role)) setIsAdmin(true);
    });
  }, []);
  
  return <CommandPalette isAdmin={isAdmin} />;
}

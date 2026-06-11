'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { Heart, Loader2 } from 'lucide-react';

export function WishlistHeart({ courseId, initialActive }: { courseId: string; initialActive?: boolean }) {
  const [active, setActive] = useState(!!initialActive);
  const [pending, startTransition] = useTransition();
  const [knownState, setKnownState] = useState(initialActive !== undefined);

  useEffect(() => {
    if (knownState) return;
    const sb = createClient();
    sb.from('nl_course_wishlist').select('user_id').eq('course_id', courseId).maybeSingle()
      .then(({ data }) => { if (data) setActive(true); setKnownState(true); });
  }, [courseId, knownState]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const next = !active;
    setActive(next); // optimistic
    startTransition(async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        window.location.href = '/pt/login?next=' + encodeURIComponent(window.location.pathname);
        return;
      }
      assertNotPeekClient();
      const { data, error } = await sb.rpc('nl_wishlist_toggle', { p_course_id: courseId });
      if (error || (data as any)?.ok === false) {
        setActive(!next);
      } else {
        setActive(!!(data as any)?.added);
      }
    });
  }

  return (
    <button onClick={toggle} disabled={pending}
      aria-label={active ? 'Remover da wishlist' : 'Adicionar à wishlist'}
      className={`p-2 rounded-full transition-all ${active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200'} disabled:opacity-50`}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${active ? 'fill-current' : ''}`} />}
    </button>
  );
}

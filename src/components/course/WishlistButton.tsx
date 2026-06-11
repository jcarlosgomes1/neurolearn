'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { Heart, Loader2 } from 'lucide-react';

export function WishlistButton({ courseId, size = 'md' }: { courseId: string; size?: 'sm'|'md'|'lg' }) {
  const [wishlisted, setWishlisted] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const sb = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setWishlisted(false); return; }
      const { data } = await sb.from('nl_course_wishlist').select('course_id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
      setWishlisted(!!data);
    })();
  }, [courseId, sb]);

  function toggle() {
    startTransition(async () => {
      assertNotPeekClient();
      const { data } = await sb.rpc('nl_wishlist_toggle', { p_course_id: courseId });
      const r = data as any;
      if (r?.ok) setWishlisted(r.wishlisted);
    });
  }

  const sizeCls = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const pad = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2';

  return (
    <button onClick={toggle} disabled={pending || wishlisted === null}
      className={`${pad} rounded-full bg-white border border-slate-200 hover:border-rose-300 transition-colors disabled:opacity-50`}
      aria-label={wishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
      {pending ? <Loader2 className={`${sizeCls} animate-spin text-slate-400`} /> :
        <Heart className={`${sizeCls} ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500'}`} />}
    </button>
  );
}

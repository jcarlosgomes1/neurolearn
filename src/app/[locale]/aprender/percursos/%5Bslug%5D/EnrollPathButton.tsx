'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles } from 'lucide-react';

export function EnrollPathButton({ pathId, isEnrolled }: { pathId: string; isEnrolled: boolean }) {
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function enroll() {
    startTransition(async () => {
      try {
        const sb = createClient();
        const { data: userData } = await sb.auth.getUser();
        if (!userData?.user) {
          router.push(('/login?redirect=' + encodeURIComponent(window.location.pathname)) as any);
          return;
        }
        const { error } = await sb.rpc('nl_learning_path_enroll', { p_path_id: pathId });
        if (error) throw error;
        setEnrolled(true);
        toast.success('Inscrição confirmada');
      } catch (e: any) {
        toast.error(e?.message || 'Erro');
      }
    });
  }

  if (enrolled) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" /> Inscrito neste percurso
      </div>
    );
  }

  return (
    <button onClick={enroll} disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-brand-600 hover:from-violet-700 hover:to-brand-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50">
      <Sparkles className="h-4 w-4" /> {pending ? 'A inscrever...' : 'Começar percurso'}
    </button>
  );
}

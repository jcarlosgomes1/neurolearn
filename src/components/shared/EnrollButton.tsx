'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';

export function EnrollButton({ courseId, priceLabel }: { courseId: string; priceLabel: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleEnroll() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        router.push(`/login?redirect_to=/curso/${courseId}` as any);
        return;
      }
      const r = await callAgentOps<{ enrolled?: boolean; already_enrolled?: boolean }>('enroll_course', { course_id: courseId });
      if (r.already_enrolled) {
        toast.success('Já estás inscrito! A abrir o curso...');
      } else {
        toast.success('Inscrição confirmada! 🎉');
      }
      router.push('/learn' as any);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message === 'not_authenticated' ? 'Inicia sessão primeiro' : e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleEnroll} disabled={loading} className="block w-full text-center bg-brand-600 text-white font-semibold py-3 rounded-lg hover:bg-brand-700 transition-colors shadow-md disabled:opacity-50">
      {loading ? 'A processar...' : `Inscrever-me · ${priceLabel}`}
    </button>
  );
}

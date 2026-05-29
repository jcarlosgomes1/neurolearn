'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';
import { AuthGate } from './AuthGate';

export function EnrollButton({ courseId, priceLabel, courseTitle }: { courseId: string; priceLabel: string; courseTitle?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  async function enrollAndGo() {
    setLoading(true);
    try {
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
    } finally { setLoading(false); }
  }

  async function handleEnroll() {
    setLoading(true);
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      setLoading(false);
      setShowAuth(true);
      return;
    }
    await enrollAndGo();
  }

  return (
    <>
      <button onClick={handleEnroll} disabled={loading} className="block w-full text-center bg-brand-600 text-white font-semibold py-3 rounded-lg hover:bg-brand-700 transition-colors shadow-md disabled:opacity-50">
        {loading ? 'A processar...' : `Inscrever-me · ${priceLabel}`}
      </button>
      <AuthGate
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={enrollAndGo}
        title={courseTitle ? `Inscreve-te em "${courseTitle}"` : 'Inscreve-te neste curso'}
        description="Cria conta em 30 segundos ou entra na tua. Depois fazemos a tua inscrição automaticamente."
      />
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';
import { AuthGate } from './AuthGate';

export function EnrollButton({ courseId, priceLabel, courseTitle }: { courseId: string; priceLabel: string; courseTitle?: string }) {
  const t = useTranslations('enroll');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const { data } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
        if (data && (data.role === 'admin' || data.role === 'super_admin')) setIsAdmin(true);
      } catch { /* silencioso */ }
    })();
  }, []);

  async function enrollAndGo() {
    setLoading(true);
    try {
      const r = await callAgentOps<{ enrolled?: boolean; already_enrolled?: boolean }>('enroll_course', { course_id: courseId });
      if (r.already_enrolled) toast.success(t('already'));
      else toast.success(t('confirmed'));
      router.push('/learn' as any);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message === 'not_authenticated' ? t('sign_in_first') : e.message);
    } finally { setLoading(false); }
  }

  // Acesso livre de admin: inscreve em qualquer curso (mesmo pago) sem pagamento, via RPC dedicada.
  async function adminFreeAccess() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_free_enroll', { p_course_id: courseId });
      if (error) throw error;
      if (data?.ok) {
        toast.success(data.already_enrolled ? t('already') : t('admin_access_granted'));
        router.push('/learn' as any);
        router.refresh();
      } else {
        toast.error(data?.error || 'error');
      }
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
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
        {loading ? t('processing') : t('button', { price: priceLabel })}
      </button>

      {isAdmin && (
        <button onClick={adminFreeAccess} disabled={loading}
          className="mt-2 block w-full text-center border border-dashed border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
          🔓 {t('admin_free_access')}
        </button>
      )}

      <AuthGate
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={enrollAndGo}
        title={courseTitle ? t('auth_title', { title: courseTitle }) : t('auth_title_fallback')}
        description={t('auth_desc')}
      />
    </>
  );
}

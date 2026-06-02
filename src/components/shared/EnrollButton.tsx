'use client';

import { useState } from 'react';
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

  async function enrollAndGo() {
    setLoading(true);
    try {
      const r = await callAgentOps<{ enrolled?: boolean; already_enrolled?: boolean }>('enroll_course', { course_id: courseId });
      if (r.already_enrolled) {
        toast.success(t('already'));
      } else {
        toast.success(t('confirmed'));
      }
      router.push('/learn' as any);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message === 'not_authenticated' ? t('sign_in_first') : e.message);
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
        {loading ? t('processing') : t('button', { price: priceLabel })}
      </button>
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

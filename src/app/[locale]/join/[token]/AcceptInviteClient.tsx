'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

export function AcceptInviteClient({ token, orgName, role }: { token: string; orgName: string; role: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_org_accept_invitation', { p_token: token });
      if (error) throw error;
      const r = data as any;
      if (r?.ok) {
        toast.success(t('emp.join.accepted'));
        // Re-fetch org slug for redirect
        const { data: org } = await sb.from('nl_organizations').select('slug').eq('id', r.org_id).single();
        if (org?.slug) router.push(`/empresa/${org.slug}` as any);
        else router.push('/conta' as any);
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('email_mismatch')) toast.error(t('emp.join.role_mismatch'));
      else toast.error(msg || 'Failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 text-white mb-4">
        <Building2 className="h-6 w-6" />
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t('emp.join.title')}</h1>
      <h2 className="text-2xl sm:text-3xl font-bold mt-1 bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">{orgName}</h2>
      <p className="text-sm text-slate-500 mt-2">Role: <strong>{role}</strong></p>
      <button onClick={accept} disabled={loading}
        className="mt-6 w-full px-6 py-3 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold">
        {loading ? '…' : t('emp.join.accept')}
      </button>
    </div>
  );
}

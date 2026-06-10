'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';

interface Invitation {
  id: string; org_id: string; org_name: string; email: string; role: string;
  expires_at: string;
}

export function AcceptClient({ token, invitation, userEmail, mismatch }: {
  token: string; invitation: Invitation; userEmail: string; mismatch: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_org_accept_invitation', { p_token: token });
      if (error) throw error;
      toast.success(t('org.acc.welcome', { org: invitation.org_name }));
      router.push({ pathname: '/conta/aprendizagem' } as any);
    } catch (e: any) {
      const msg = e?.message || t('org.acc.accept_error');
      if (msg.includes('email_mismatch')) toast.error(t('org.acc.email_mismatch'));
      else if (msg.includes('already_accepted')) toast.error(t('org.acc.already'));
      else if (msg.includes('invitation_expired')) toast.error(t('org.acc.expired'));
      else toast.error(msg);
    } finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
        <Building2 className="h-8 w-8 text-violet-600 mx-auto mb-2" />
        <p className="text-sm text-slate-600">{t('org.acc.invited_to')}</p>
        <h2 className="font-bold text-lg text-slate-900 mt-0.5">{invitation.org_name}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t('org.acc.as')} <span className="font-semibold text-violet-700">{invitation.role}</span>
        </p>
      </div>
      {mismatch && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800">
            <strong>{t('org.acc.email_diff_h')}</strong> {t('org.acc.email_diff_p1')} <code className="bg-rose-100 px-1 rounded">{userEmail}</code> {t('org.acc.email_diff_p2')} <code className="bg-rose-100 px-1 rounded">{invitation.email}</code>. {t('org.acc.email_diff_p3')}
          </div>
        </div>
      )}
      <button onClick={accept} disabled={busy || mismatch}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        {t('org.acc.accept_btn')}
      </button>
      <p className="text-[10px] text-slate-400 text-center">
        {t('org.acc.footer_note')}
      </p>
    </div>
  );
}

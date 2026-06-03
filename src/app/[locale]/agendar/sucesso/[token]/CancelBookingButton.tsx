'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function CancelBookingButton({ bookingId, token }: { bookingId: string; token: string }) {
  const t = useTranslations();
  const [submitting, setSubmitting] = useState(false);

  async function cancel() {
    if (!confirm('Cancelar esta marcação?')) return;
    setSubmitting(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_scheduling_cancel_booking', {
        p_booking_id: bookingId, p_token: token, p_reason: 'cancelled_by_guest',
      });
      if (error || !(data as any)?.ok) { toast.error(error?.message || 'erro'); return; }
      toast.success(t('sched.public.cancelled'));
      window.location.reload();
    } finally { setSubmitting(false); }
  }

  return (
    <button onClick={cancel} disabled={submitting} className="mt-6 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50">
      {submitting ? '…' : t('sched.public.cancel_btn')}
    </button>
  );
}

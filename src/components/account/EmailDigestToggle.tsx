'use client';

import { useState, useTransition } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export function EmailDigestToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  
  function toggle() {
    const next = !enabled;
    setEnabled(next); // optimistic
    startTransition(async () => {
      const sb = createClient();
      const { error } = await sb.rpc('nl_email_digest_set_preference', { p_enabled: next });
      if (error) {
        setEnabled(!next); // revert
        toast.error(error.message);
      } else {
        toast.success(next ? 'Digest semanal activo' : 'Digest semanal desactivado');
      }
    });
  }
  
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <Mail className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-slate-900">Resumo semanal por email</div>
          <p className="text-xs text-slate-500 mt-0.5">Recebe um digest às segundas com as notificações não lidas.</p>
        </div>
      </div>
      <button onClick={toggle} disabled={isPending}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-brand-600' : 'bg-slate-300'
        } ${isPending ? 'opacity-70' : ''}`}>
        {isPending && <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />}
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );
}

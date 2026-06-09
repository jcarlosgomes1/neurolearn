'use client';

import { Shield, X } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'nl_2fa_banner_dismissed';

export function TwoFactorBanner({ role }: { role: string }) {
  // Start hidden to avoid a flash for users who already dismissed (server renders null).
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setHidden(true);
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-600 flex-shrink-0" aria-hidden />
        <p className="text-xs sm:text-sm text-amber-900 truncate flex-1 min-w-0">
          <strong>2FA recomendada</strong> para a tua conta ({role}).
        </p>
        <Link href={'/conta/seguranca' as any}
          className="text-xs sm:text-sm font-semibold text-amber-900 hover:underline whitespace-nowrap flex-shrink-0">
          Activar &rarr;
        </Link>
        <button onClick={dismiss} aria-label="Dispensar"
          className="flex-shrink-0 w-7 h-7 rounded-md hover:bg-amber-100 flex items-center justify-center text-amber-700 active:scale-95 transition-transform">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

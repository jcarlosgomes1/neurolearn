'use client';

import { Shield } from 'lucide-react';
import { Link } from '@/i18n/routing';

export function TwoFactorBanner({ role }: { role: string }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-900">
            <strong>Autenticação 2FA recomendada</strong> para a tua role ({role}). Activa em segurança.
          </p>
        </div>
        <Link href={'/conta/seguranca' as any}
          className="text-sm font-semibold text-amber-900 hover:underline">
          Activar agora →
        </Link>
      </div>
    </div>
  );
}

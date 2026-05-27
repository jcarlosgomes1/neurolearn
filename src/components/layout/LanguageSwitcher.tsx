'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';

const LANGS = [
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={locale}
      onChange={(e) => {
        const newLocale = e.target.value;
        startTransition(() => {
          router.replace(pathname, { locale: newLocale });
        });
      }}
      disabled={pending}
      className="text-sm bg-transparent border border-slate-200 rounded-md px-2 py-1 cursor-pointer hover:border-slate-300 transition-colors disabled:opacity-50"
      aria-label="Language"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}

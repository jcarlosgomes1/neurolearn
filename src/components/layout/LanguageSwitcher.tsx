'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';

const LANGS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
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
        startTransition(async () => {
          // Persistir na conta (se logado). Para anónimos é no-op seguro.
          try {
            const sb = createClient();
            await sb.rpc('nl_set_my_preferred_lang', { p_lang: newLocale });
          } catch {
            // ignora — a troca de sessão acontece de qualquer forma
          }
          router.replace(pathname, { locale: newLocale });
        });
      }}
      disabled={pending}
      className="text-sm bg-transparent border border-[var(--line)] rounded-md px-2 py-1 cursor-pointer hover:border-[var(--line)] transition-colors disabled:opacity-50"
      aria-label="Language"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}

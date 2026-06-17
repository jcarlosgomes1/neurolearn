'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

/**
 * Wrapper cliente do NextIntlClientProvider com a MESMA resiliência do servidor
 * (ver src/i18n/request.ts): uma chave em falta — incluindo chaves montadas
 * dinamicamente — NUNCA derruba a página no cliente. Degrada para o texto da
 * própria chave. onError/getMessageFallback têm de viver num componente
 * 'use client' porque funções não atravessam a fronteira server→client.
 */
export function ClientIntlProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Record<string, unknown>;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={(error) => {
        if ((error as { code?: string })?.code !== 'MISSING_MESSAGE') {
          console.error('[i18n/client]', error);
        }
      }}
      getMessageFallback={({ namespace, key }) =>
        namespace ? `${namespace}.${key}` : key
      }
    >
      {children}
    </NextIntlClientProvider>
  );
}

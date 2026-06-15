// Resolução de texto de notificações na língua ATUAL da interface.
// As notificações guardam o texto literal (resolvido na língua preferida do
// destinatário no momento da emissão) e, em metadata.i18n, as chaves + params.
// Este helper re-resolve a partir das chaves usando o mapa de mensagens da
// locale atual (useMessages), com interpolação simples {param} — deliberadamente
// SEM o ICU do t() para não quebrar apóstrofos (ex.: francês "L'abonnement").
// Cai sempre no literal guardado quando não há chave/mensagem.
'use client';

import { useMessages } from 'next-intl';

interface NotificationTextInput {
  title?: string | null;
  message?: string | null;
  metadata?: Record<string, any> | null;
}

function lookupRaw(messages: any, key: string): string | null {
  if (!messages || !key) return null;
  const val = key.split('.').reduce((o: any, k: string) => (o == null ? undefined : o[k]), messages);
  return typeof val === 'string' ? val : null;
}

function interpolate(s: string, params?: Record<string, any> | null): string {
  if (!params) return s;
  let out = s;
  for (const [k, v] of Object.entries(params)) {
    out = out.split('{' + k + '}').join(v == null ? '' : String(v));
  }
  return out;
}

export function useNotificationText() {
  const messages = useMessages();
  return (n: NotificationTextInput): { title: string; message: string } => {
    const i18n = n?.metadata?.i18n;
    if (i18n && typeof i18n.title === 'string') {
      const rawTitle = lookupRaw(messages, i18n.title);
      const rawBody = typeof i18n.body === 'string' ? lookupRaw(messages, i18n.body) : null;
      if (rawTitle) {
        return {
          title: interpolate(rawTitle, i18n.params),
          message: rawBody ? interpolate(rawBody, i18n.params) : (n.message || ''),
        };
      }
    }
    return { title: n.title || '', message: n.message || '' };
  };
}

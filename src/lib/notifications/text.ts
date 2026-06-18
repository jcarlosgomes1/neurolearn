// Resolução de texto de notificações na língua ATUAL da interface.
// metadata.i18n = { title:<key>, body:<key>, params:{...} }. Resolve a chave no
// mapa de mensagens (suporta mapa PLANO com keys-ponto E aninhado) e interpola
// {param}. Cai SEMPRE no literal guardado quando a chave não existe ou quando
// sobra algum {placeholder} por resolver (param em falta) — nunca mostra texto partido.
'use client';

import { useMessages } from 'next-intl';

interface NotificationTextInput {
  title?: string | null;
  message?: string | null;
  metadata?: Record<string, any> | null;
}

function lookupRaw(messages: any, key: string): string | null {
  if (!messages || !key) return null;
  // 1) chave PLANA (mapa dotted): messages["notif.x.title"]
  if (typeof messages[key] === 'string') return messages[key] as string;
  // 2) travessia ANINHADA: messages.notif.x.title
  const val = key.split('.').reduce((o: any, k: string) => (o == null ? undefined : o[k]), messages);
  return typeof val === 'string' ? val : null;
}

function interpolate(s: string, params?: Record<string, any> | null): string {
  if (!params) return s;
  let out = s;
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    out = out.split('{' + k + '}').join(String(v));
  }
  return out;
}

function hasUnresolved(s: string): boolean {
  return /\{[a-zA-Z0-9_]+\}/.test(s);
}

export function useNotificationText() {
  const messages = useMessages();
  return (n: NotificationTextInput): { title: string; message: string } => {
    let title = n.title || '';
    let message = n.message || '';
    const i18n = n?.metadata?.i18n;
    if (i18n && typeof i18n.title === 'string') {
      const raw = lookupRaw(messages, i18n.title);
      if (raw) { const t = interpolate(raw, i18n.params); if (!hasUnresolved(t)) title = t; }
    }
    if (i18n && typeof i18n.body === 'string') {
      const raw = lookupRaw(messages, i18n.body);
      if (raw) { const b = interpolate(raw, i18n.params); if (!hasUnresolved(b)) message = b; }
    }
    return { title, message };
  };
}

// Resolve strings de UI (chrome) na língua atual, robusto a mapa plano ou aninhado.
export function useUiText() {
  const messages = useMessages();
  return (key: string, fallback = ''): string => {
    const v = lookupRaw(messages, key);
    return v != null ? v : fallback;
  };
}

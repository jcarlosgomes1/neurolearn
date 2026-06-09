'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Info, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TopBarData {
  enabled: boolean;
  message: string;
  link_url?: string | null;
  link_label?: string | null;
  style: 'info' | 'promo' | 'warning' | 'success' | string;
  dismissible: boolean;
}

const STYLES: Record<string, { cls: string; icon: any }> = {
  info:    { cls: 'from-blue-600 via-indigo-600 to-violet-600', icon: Info },
  promo:   { cls: 'from-fuchsia-600 via-pink-600 to-rose-600',  icon: Sparkles },
  warning: { cls: 'from-amber-500 via-orange-500 to-rose-500',  icon: AlertTriangle },
  success: { cls: 'from-emerald-500 via-teal-500 to-cyan-500',  icon: CheckCircle2 },
};

const COOKIE_NAME = 'nl_topbar_dismissed';

function isDismissed(message: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const v = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!v) return false;
    const hash = v.split('=')[1];
    return hash === btoa(message.slice(0, 50)).slice(0, 12);
  } catch { return false; }
}

function setDismissed(message: string) {
  if (typeof document === 'undefined') return;
  const hash = btoa(message.slice(0, 50)).slice(0, 12);
  // 7 dias
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${hash}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

export function TopBarClient({ data }: { data: TopBarData }) {
  const t = useTranslations();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (data.dismissible && isDismissed(data.message)) setVisible(false);
  }, [data.message, data.dismissible]);

  if (!visible) return null;

  const style = STYLES[data.style] || STYLES.info;
  const Icon = style.icon;
  const isExternal = data.link_url?.startsWith('http');

  function handleDismiss() {
    setDismissed(data.message);
    setVisible(false);
  }

  const inner = (
    <div className="flex items-center justify-center gap-2 text-sm font-medium text-white py-2 px-4">
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="line-clamp-1">{data.message}</span>
      {data.link_url && data.link_label && (
        <span className="inline-flex items-center gap-1 underline underline-offset-2 font-semibold">
          {data.link_label}
          <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  return (
    <div className={`relative bg-gradient-to-r ${style.cls} animate-in fade-in slide-in-from-top-2 duration-500`}>
      {data.link_url ? (
        <a href={data.link_url} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}
          className="block hover:bg-black/10 transition-colors">
          {inner}
        </a>
      ) : (
        inner
      )}
      {data.dismissible && (
        <button onClick={handleDismiss} aria-label={t('btn.close')}
          className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

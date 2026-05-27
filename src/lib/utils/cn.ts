import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtCents(cents: number | null | undefined, currency = 'EUR', locale = 'pt-PT'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format((cents ?? 0) / 100);
}

export function fmtDate(iso: string | Date, locale = 'pt-PT'): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}

export function relTime(iso: string | Date, locale = 'pt-PT'): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const m = Math.round((d.getTime() - Date.now()) / 60000);
  if (Math.abs(m) < 60) return rtf.format(m, 'minute');
  const hr = Math.round(m / 60);
  if (Math.abs(hr) < 24) return rtf.format(hr, 'hour');
  const day = Math.round(hr / 24);
  if (Math.abs(day) < 30) return rtf.format(day, 'day');
  return fmtDate(d, locale);
}
